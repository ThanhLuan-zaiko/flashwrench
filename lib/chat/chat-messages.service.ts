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
import { publishChatMessage, publishChatRead } from "./chat-realtime";

const MESSAGES_SCOPE_PREFIX = "chat-messages";
const MAX_BODY_LENGTH = 2000;
const DEFAULT_PAGE = 20;

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

export async function sendChatMessage(
  actor: ChatActor,
  threadId: string,
  rawBody: string,
): Promise<ChatResult<ChatMessage>> {
  const member = await requireChatMember(actor, threadId);
  if (!isMembership(member)) return member;
  const body = rawBody.trim();
  if (body.length === 0) return chatFail(400, "Tin nhắn không được để trống.");
  if (body.length > MAX_BODY_LENGTH) {
    return chatFail(400, `Tin nhắn tối đa ${MAX_BODY_LENGTH} ký tự.`);
  }
  const now = new Date();
  const messageId = randomUUID();
  const preview = body.length > 120 ? `${body.slice(0, 117)}...` : body;
  await insertMessage({
    threadId,
    messageId,
    senderId: actor.id,
    kind: "text",
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
      kind: "text",
      body,
      createdAt: now.toISOString(),
      mine: true,
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
