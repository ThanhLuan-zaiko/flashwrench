// Fetch layer for the internal chat. Components never call fetch directly.
import type {
  ChatMessage,
  ChatMessageKind,
  ChatThreadDetail,
  ChatThreadSummary,
} from "@/lib/chat/chat.types";
import type { ChatBookingContext } from "@/lib/chat/chat-booking.types";
import { uploadMediaRequest } from "./media.api";

async function readErrors(response: Response): Promise<Record<string, string>> {
  try {
    const body = (await response.json()) as { errors?: Record<string, string> };
    return body.errors ?? { form: "Có lỗi xảy ra. Vui lòng thử lại." };
  } catch {
    return { form: "Có lỗi xảy ra. Vui lòng thử lại." };
  }
}

export type ChatThreadPage = {
  items: ChatThreadSummary[];
  nextCursor: string | null;
  unreadThreads: number;
};

export type ChatMessagePage = {
  items: ChatMessage[];
  nextCursor: string | null;
};

export async function fetchChatThreads(params: {
  cursor?: string | null;
  limit?: number;
}): Promise<ChatThreadPage> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  const response = await fetch(`/api/chat/threads${suffix}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không tải được hộp thư.");
  }
  return (await response.json()) as ChatThreadPage;
}

export async function openChatThread(
  bookingId: string,
): Promise<ChatThreadSummary> {
  const response = await fetch("/api/chat/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ bookingId }),
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không mở được cuộc trò chuyện.");
  }
  return (await response.json()) as ChatThreadSummary;
}

export async function fetchChatThread(
  threadId: string,
): Promise<ChatThreadDetail> {
  const response = await fetch(`/api/chat/threads/${threadId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không tải được cuộc trò chuyện.");
  }
  return (await response.json()) as ChatThreadDetail;
}

export async function fetchChatMessages(
  threadId: string,
  cursor?: string | null,
): Promise<ChatMessagePage> {
  const search = new URLSearchParams();
  if (cursor) search.set("cursor", cursor);
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  const response = await fetch(
    `/api/chat/threads/${threadId}/messages${suffix}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không tải được tin nhắn.");
  }
  return (await response.json()) as ChatMessagePage;
}

export type ChatSendInput = { body: string; kind?: ChatMessageKind };

export async function sendChatMessage(
  threadId: string,
  body: string,
): Promise<ChatMessage> {
  return sendChatContentMessage(threadId, { body, kind: "text" });
}

export async function sendChatContentMessage(
  threadId: string,
  input: ChatSendInput,
): Promise<ChatMessage> {
  const response = await fetch(`/api/chat/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ body: input.body, kind: input.kind ?? "text" }),
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không gửi được tin nhắn.");
  }
  return (await response.json()) as ChatMessage;
}

// Chat image upload through the shared media pipeline (scope "misc",
// owned by the thread). The returned URL is what travels as an image
// message body; the service accepts only our own /api/media URLs.
export async function uploadChatImage(
  threadId: string,
  file: Blob,
): Promise<string> {
  const { asset } = await uploadMediaRequest({
    file,
    scope: "misc",
    ownerType: "chat-thread",
    ownerId: threadId,
    alt: "Ảnh trong cuộc trò chuyện",
  });
  return asset.url;
}

export async function markChatThreadRead(threadId: string): Promise<void> {
  const response = await fetch(`/api/chat/threads/${threadId}/read`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không cập nhật được trạng thái đã đọc.");
  }
}

export async function fetchChatBookings(
  threadId: string,
): Promise<ChatBookingContext[]> {
  const response = await fetch(`/api/chat/threads/${threadId}/bookings`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errors = await readErrors(response);
    throw new Error(errors.form ?? "Không tải được đơn liên quan.");
  }
  const body = (await response.json()) as { items: ChatBookingContext[] };
  return body.items ?? [];
}
