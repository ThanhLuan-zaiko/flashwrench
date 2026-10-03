// Shared helpers for the chat services: result shaping, role gate, row
// mappers and the membership check every thread operation starts with.
import type { UserRole } from "@/lib/auth/user.types";
import { isUuid } from "@/lib/validation";
import { findInboxRow } from "./chat.repository";
import type {
  ChatMessage,
  ChatResult,
  ChatThreadSummary,
  InboxRow,
  MessageRow,
} from "./chat.types";
import { normalizeMessageKind } from "./chat-content";

export type ChatActor = { id: string; role: UserRole };

export function chatFail<T>(status: number, form: string): ChatResult<T> {
  return { ok: false, status, errors: { form } };
}

export function isChatRole(role: UserRole): boolean {
  return role === "customer" || role === "mechanic";
}

export function toSummary(
  row: InboxRow,
  unreadCount: number,
): ChatThreadSummary {
  return {
    id: row.thread_id,
    peerId: row.peer_id ?? "",
    peerName: row.peer_name ?? "Người dùng",
    peerRole: (row.peer_role as UserRole) ?? "customer",
    peerAvatarUrl: row.peer_avatar_url,
    lastMessageAt: row.last_message_at?.toISOString() ?? null,
    lastMessagePreview: row.last_message_preview ?? "",
    lastMessageSenderId: row.last_message_sender,
    lastReadAt: row.last_read_at?.toISOString() ?? null,
    unreadCount,
  };
}

export function toMessage(row: MessageRow, viewerId: string): ChatMessage {
  return {
    id: row.message_id,
    threadId: row.thread_id,
    senderId: row.sender_id ?? "",
    kind: normalizeMessageKind(row.kind),
    body: row.body ?? "",
    createdAt: row.created_at?.toISOString() ?? new Date(0).toISOString(),
    mine: row.sender_id === viewerId,
  };
}

export type Membership = { inbox: InboxRow; peerId: string };

// The caller's inbox row IS the membership record — no row, no access,
// regardless of what the thread table says.
export async function requireChatMember(
  actor: ChatActor,
  threadId: string,
): Promise<Membership | ChatResult<never>> {
  if (!isUuid(threadId)) return chatFail(400, "Cuộc trò chuyện không hợp lệ.");
  const inbox = await findInboxRow(actor.id, threadId);
  if (!inbox?.peer_id) {
    return chatFail(404, "Không tìm thấy cuộc trò chuyện.");
  }
  return { inbox, peerId: inbox.peer_id };
}

export function isMembership(
  value: Membership | ChatResult<never>,
): value is Membership {
  return !("ok" in value);
}
