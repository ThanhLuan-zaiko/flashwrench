// Message-level chat operations: paged history, sending and read marks.
// Thread opening and the inbox list live in chat.service.ts.
import { randomUUID } from "node:crypto";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import {
  findInboxRow,
  insertMessage,
  listMessageRows,
  markInboxRead,
  updateThreadSnapshot,
  upsertInboxRow,
} from "./chat.repository";
import type { ChatMessage, ChatResult, InboxRow } from "./chat.types";
import {
  type ChatActor,
  chatFail,
  isMembership,
  requireChatMember,
  toMessage,
} from "./chat-access";
import {
  CHAT_TEXT_MAX,
  chatContentPreview,
  formatChatLocation,
  isChatImageUrl,
  parseChatLocation,
  parseMessageKind,
} from "./chat-content";
import { publishChatMessage, publishChatRead } from "./chat-realtime";

const MESSAGES_SCOPE_PREFIX = "chat-messages";
const DEFAULT_PAGE = 20;

export type ChatContentInput = { kind?: unknown; body: unknown };

// Text stays the default: image/location go through the same membership,
// persistence and websocket fanout, only validation and preview differ.
export async function sendChatContentMessage(
  actor: ChatActor,
  threadId: string,
  input: ChatContentInput,
): Promise<ChatResult<ChatMessage>> {
  const member = await requireChatMember(actor, threadId);
  if (!isMembership(member)) return member;
  const kind = parseMessageKind(input.kind ?? "text");
  if (!kind) return chatFail(400, "Loại tin nhắn không hợp lệ.");
  let body = "";
  if (kind === "text") {
    body = typeof input.body === "string" ? input.body.trim() : "";
    if (body.length === 0)
      return chatFail(400, "Tin nhắn không được để trống.");
    if (body.length > CHAT_TEXT_MAX) {
      return chatFail(400, `Tin nhắn tối đa ${CHAT_TEXT_MAX} ký tự.`);
    }
  } else if (kind === "image") {
    if (!isChatImageUrl(input.body)) {
      return chatFail(400, "Ảnh không hợp lệ. Vui lòng tải lại.");
    }
    body = input.body;
  } else {
    const point = parseChatLocation(input.body);
    if (!point) {
      return chatFail(400, "Vị trí không hợp lệ. Vui lòng thử lại.");
    }
    body = formatChatLocation(point);
  }
  const now = new Date();
  const messageId = randomUUID();
  const preview = chatContentPreview(kind, body);
  await insertMessage({
    threadId,
    messageId,
    senderId: actor.id,
    kind,
    body,
    createdAt: now,
  });
  // Persisted — now refresh both inbox rows and the thread's last-activity
  // snapshot. Each side's row keeps its own denormalized peer fields; only
  // the preview columns move.
  const peerInbox = await findInboxRow(member.peerId, threadId);
  const bump = (row: InboxRow | null, userId: string) =>
    upsertInboxRow({
      userId,
      threadId,
      peerId: row?.peer_id ?? (userId === actor.id ? member.peerId : actor.id),
      peerName: row?.peer_name ?? "",
      peerRole: row?.peer_role ?? "customer",
      peerAvatarUrl: row?.peer_avatar_url ?? null,
      lastMessageAt: now,
      lastMessagePreview: preview,
      lastMessageSender: actor.id,
      createdAt: row?.created_at ?? now,
    });
  await Promise.all([
    bump(member.inbox, actor.id),
    bump(peerInbox, member.peerId),
    updateThreadSnapshot(threadId, now, preview, actor.id),
  ]);
  // Realtime only after persistence — a failed write must never emit.
  // The websocket event carries ids only; every kind (text, image,
  // location) fans out identically and clients refetch over REST.
  await publishChatMessage({
    threadId,
    messageId,
    senderId: actor.id,
    recipientIds: [member.peerId, actor.id],
  });
  return {
    ok: true,
    data: {
      id: messageId,
      threadId,
      senderId: actor.id,
      kind,
      body,
      createdAt: now.toISOString(),
      mine: true,
    },
  };
}

export async function sendChatMessage(
  actor: ChatActor,
  threadId: string,
  rawBody: string,
): Promise<ChatResult<ChatMessage>> {
  return sendChatContentMessage(actor, threadId, {
    kind: "text",
    body: rawBody,
  });
}

export type MessagePage = { items: ChatMessage[]; nextCursor: string | null };

// Page of a thread's history, newest row first. The client reverses each
// page for display and asks for the next cursor to walk further back.
export async function listThreadMessages(
  actor: ChatActor,
  threadId: string,
  params: { cursor?: string | null; limit?: number } = {},
): Promise<ChatResult<MessagePage>> {
  const member = await requireChatMember(actor, threadId);
  if (!isMembership(member)) return member;
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(
      params.cursor,
      `${MESSAGES_SCOPE_PREFIX}:${threadId}`,
    );
  } catch {
    return chatFail(400, "Con trỏ phân trang không hợp lệ.");
  }
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_PAGE, 1), 50);
  const page = await listMessageRows(threadId, limit, pageState);
  return {
    ok: true,
    data: {
      items: page.rows.map((row) => toMessage(row, actor.id)),
      nextCursor: encodeCursor(
        page.pageState,
        `${MESSAGES_SCOPE_PREFIX}:${threadId}`,
      ),
    },
  };
}

export async function markThreadRead(
  actor: ChatActor,
  threadId: string,
): Promise<ChatResult<{ readAt: string }>> {
  const member = await requireChatMember(actor, threadId);
  if (!isMembership(member)) return member;
  const readAt = new Date();
  await markInboxRead(actor.id, threadId, readAt);
  await publishChatRead({
    threadId,
    readerId: actor.id,
    recipientIds: [member.peerId, actor.id],
  });
  return { ok: true, data: { readAt: readAt.toISOString() } };
}
