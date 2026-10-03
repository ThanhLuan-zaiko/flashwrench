// Shared row/response shapes for the internal customer<->mechanic chat.
// Rows mirror ScyllaDB columns (snake_case); DTOs are the API wire shape.
import type { UserRole } from "@/lib/auth/user.types";

export type ThreadRow = {
  thread_id: string;
  customer_id: string | null;
  mechanic_id: string | null;
  created_at: Date | null;
  last_message_at: Date | null;
  last_message_preview: string | null;
  last_message_sender: string | null;
};

export type InboxRow = {
  user_id: string;
  thread_id: string;
  peer_id: string | null;
  peer_name: string | null;
  peer_role: string | null;
  peer_avatar_url: string | null;
  last_message_at: Date | null;
  last_message_preview: string | null;
  last_message_sender: string | null;
  last_read_at: Date | null;
  created_at: Date | null;
};

export type MessageRow = {
  thread_id: string;
  created_at: Date | null;
  message_id: string;
  sender_id: string | null;
  kind: string | null;
  body: string | null;
};

export type ChatThreadSummary = {
  id: string;
  peerId: string;
  peerName: string;
  peerRole: UserRole;
  peerAvatarUrl: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  lastMessageSenderId: string | null;
  lastReadAt: string | null;
  unreadCount: number;
};

export type ChatThreadDetail = ChatThreadSummary & {
  peerLastReadAt: string | null;
};

export type ChatMessageKind = "text" | "image" | "location";

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  kind: ChatMessageKind;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type ChatResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: Record<string, string> };
