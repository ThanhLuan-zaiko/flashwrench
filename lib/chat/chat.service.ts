// Thread-level operations for the internal customer<->mechanic chat.
// Threads are established through a real booking relationship (the booking
// row is the authorization anchor); afterwards the pair keeps one ongoing
// thread. Message-level operations live in chat-messages.service.ts.
import { randomUUID } from "node:crypto";
import { findUserById } from "@/lib/auth/user.repository";
import type { UserRole } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { isUuid } from "@/lib/validation";
import {
  findInboxRow,
  findThreadIdByPair,
  findThreadRowById,
  insertThread,
  listInboxRows,
  listUnreadSenders,
  upsertInboxRow,
} from "./chat.repository";
import type {
  ChatResult,
  ChatThreadDetail,
  ChatThreadSummary,
  InboxRow,
} from "./chat.types";
import {
  type ChatActor,
  chatFail,
  isChatRole,
  isMembership,
  requireChatMember,
  toSummary,
} from "./chat-access";

const THREADS_SCOPE = "chat-threads";
const DEFAULT_PAGE = 20;

function peerRoleOf(role: UserRole): UserRole {
  return role === "customer" ? "mechanic" : "customer";
}

// ---------------------------------------------------------------------------
// Open or reuse the thread for a booking's (customer, mechanic) pair.
// The booking row itself authorizes both ends: a customer must own the
// booking, a mechanic must be its assignee — arbitrary pairs can't form.
// ---------------------------------------------------------------------------
export async function openThreadForBooking(
  actor: ChatActor,
  rawBookingId: string,
): Promise<ChatResult<ChatThreadSummary>> {
  if (!isChatRole(actor.role)) {
    return chatFail(403, "Chỉ khách hàng và thợ mới có thể nhắn tin.");
  }
  const bookingId = rawBookingId.trim();
  if (!isUuid(bookingId)) return chatFail(400, "Mã đơn hàng không hợp lệ.");
  const booking = await findBookingRowById(bookingId);
  if (!booking) return chatFail(404, "Không tìm thấy đơn hàng.");
  const customerId = booking.customer_id;
  const mechanicId = booking.mechanic_id;
  if (!customerId || !mechanicId) {
    return chatFail(400, "Đơn hàng chưa có đủ khách hàng và thợ.");
  }
  const isCustomer = actor.role === "customer" && actor.id === customerId;
  const isMechanic = actor.role === "mechanic" && actor.id === mechanicId;
  if (!isCustomer && !isMechanic) {
    return chatFail(403, "Bạn không thuộc cuộc trò chuyện của đơn hàng này.");
  }
  const peerId = isCustomer ? mechanicId : customerId;
  const existingId = await findThreadIdByPair(customerId, mechanicId);
  if (existingId) {
    const inbox = await findInboxRow(actor.id, existingId);
    if (inbox) return { ok: true, data: toSummary(inbox, 0) };
  }
  const [actorRow, peerRow] = await Promise.all([
    findUserById(actor.id),
    findUserById(peerId),
  ]);
  if (actorRow?.status !== "active") {
    return chatFail(403, "Tài khoản của bạn không khả dụng.");
  }
  if (peerRow?.status !== "active" || peerRow.role !== peerRoleOf(actor.role)) {
    return chatFail(404, "Không tìm thấy tài khoản đối phương.");
  }
  const threadId = existingId ?? randomUUID();
  const now = new Date();
  if (!existingId) {
    await insertThread({ threadId, customerId, mechanicId, now });
  }
  // Both inbox rows are (re)written so a stale/lost row self-heals — but a
  // pre-existing row keeps its preview columns (identity refresh only).
  const [actorInbox, peerInbox] = await Promise.all([
    findInboxRow(actor.id, threadId),
    findInboxRow(peerId, threadId),
  ]);
  await Promise.all([
    upsertInboxRow({
      userId: actorRow.user_id,
      threadId,
      peerId: peerRow.user_id,
      peerName: peerRow.full_name ?? "Người dùng",
      peerRole: peerRow.role ?? "customer",
      peerAvatarUrl: peerRow.avatar_url,
      lastMessageAt: actorInbox?.last_message_at ?? null,
      lastMessagePreview: actorInbox?.last_message_preview ?? null,
      lastMessageSender: actorInbox?.last_message_sender ?? null,
      createdAt: actorInbox?.created_at ?? now,
    }),
    upsertInboxRow({
      userId: peerRow.user_id,
      threadId,
      peerId: actorRow.user_id,
      peerName: actorRow.full_name ?? "Người dùng",
      peerRole: actorRow.role ?? "customer",
      peerAvatarUrl: actorRow.avatar_url,
      lastMessageAt: peerInbox?.last_message_at ?? null,
      lastMessagePreview: peerInbox?.last_message_preview ?? null,
      lastMessageSender: peerInbox?.last_message_sender ?? null,
      createdAt: peerInbox?.created_at ?? now,
    }),
  ]);
  const inbox = await findInboxRow(actor.id, threadId);
  if (!inbox) return chatFail(500, "Không thể mở cuộc trò chuyện.");
  return { ok: true, data: toSummary(inbox, 0) };
}

export type ThreadPage = {
  items: ChatThreadSummary[];
  nextCursor: string | null;
  unreadThreads: number;
};

// Exact "threads with something new" from denormalized inbox columns only
// — zero extra queries, so the FAB badge is always the whole inbox.
function countUnreadThreads(rows: InboxRow[], actorId: string): number {
  const epoch = new Date(0);
  return rows.filter((row) => {
    if (!row.last_message_at || row.last_message_sender === actorId) {
      return false;
    }
    return (
      row.last_message_at.getTime() > (row.last_read_at ?? epoch).getTime()
    );
  }).length;
}

// Inbox rows share one partition per user; the sorted list is sliced by a
// signed offset cursor so page boundaries survive new-message reorders.
export async function listMyThreads(
  actor: ChatActor,
  params: { cursor?: string | null; limit?: number } = {},
): Promise<ChatResult<ThreadPage>> {
  if (!isChatRole(actor.role)) return chatFail(403, "Không có quyền truy cập.");
  let offset = 0;
  if (params.cursor) {
    try {
      const state = decodeCursor(params.cursor, `${THREADS_SCOPE}:${actor.id}`);
      offset = Math.max(0, Number.parseInt(state ?? "0", 10) || 0);
    } catch {
      return chatFail(400, "Con trỏ phân trang không hợp lệ.");
    }
  }
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_PAGE, 1), 50);
  const rows = await listInboxRows(actor.id);
  const sorted = [...rows].sort((a, b) => {
    const at = a.last_message_at ?? a.created_at ?? new Date(0);
    const bt = b.last_message_at ?? b.created_at ?? new Date(0);
    return bt.getTime() - at.getTime();
  });
  const slice = sorted.slice(offset, offset + limit);
  const items = await Promise.all(
    slice.map(async (row) => {
      const senders = await listUnreadSenders(row.thread_id, row.last_read_at);
      return toSummary(row, senders.filter((id) => id !== actor.id).length);
    }),
  );
  const nextOffset = offset + slice.length;
  const nextCursor =
    nextOffset < sorted.length
      ? encodeCursor(String(nextOffset), `${THREADS_SCOPE}:${actor.id}`)
      : null;
  return {
    ok: true,
    data: {
      items,
      nextCursor,
      unreadThreads: countUnreadThreads(rows, actor.id),
    },
  };
}

export async function getThread(
  actor: ChatActor,
  threadId: string,
): Promise<ChatResult<ChatThreadDetail>> {
  const member = await requireChatMember(actor, threadId);
  if (!isMembership(member)) return member;
  const thread = await findThreadRowById(threadId);
  const peerInbox = await findInboxRow(member.peerId, threadId);
  const senders = await listUnreadSenders(threadId, member.inbox.last_read_at);
  return {
    ok: true,
    data: {
      ...toSummary(
        member.inbox,
        senders.filter((id) => id !== actor.id).length,
      ),
      peerLastReadAt:
        peerInbox?.last_read_at?.toISOString() ??
        thread?.created_at?.toISOString() ??
        null,
    },
  };
}
