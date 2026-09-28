import type {
  CommentItem,
  CommentPage,
  CommentTargetType,
} from "@/lib/comments/comment.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { CommentItem, CommentPage, CommentTargetType };
export { AuthApiError };

// One comment thread per entity. Part threads are public to read;
// private threads (booking/order/rescue/complaint) need a session.
export function fetchComments(
  targetType: CommentTargetType,
  targetId: string,
  cursor?: string | null,
): Promise<{ comments: CommentPage }> {
  const params = new URLSearchParams({ targetType, targetId });
  if (cursor) params.set("cursor", cursor);
  return apiRequest<{ comments: CommentPage }>(
    `/api/comments?${params.toString()}`,
  );
}

export function addCommentRequest(payload: {
  targetType: CommentTargetType;
  targetId: string;
  body: string;
}): Promise<{ comment: CommentItem }> {
  return apiRequest<{ comment: CommentItem }>("/api/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
