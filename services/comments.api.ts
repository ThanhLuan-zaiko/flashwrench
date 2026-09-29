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

// Replies under one top-level comment, oldest first.
export function fetchReplies(
  parentId: string,
  cursor?: string | null,
): Promise<{ comments: CommentPage }> {
  const params = new URLSearchParams({ parent: parentId });
  if (cursor) params.set("cursor", cursor);
  return apiRequest<{ comments: CommentPage }>(
    `/api/comments?${params.toString()}`,
  );
}

export function addCommentRequest(payload: {
  targetType: CommentTargetType;
  targetId: string;
  body: string;
  parentId?: string;
}): Promise<{ comment: CommentItem }> {
  return apiRequest<{ comment: CommentItem }>("/api/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Staff moderation: hide/unhide a comment or reply (admin + dispatcher).
// targetType/targetId let the server locate legacy rows missing from the
// comment-id lookup table.
export function moderateCommentRequest(payload: {
  commentId: string;
  action: "hide" | "unhide";
  targetType: CommentTargetType;
  targetId: string;
}): Promise<{ comment: { id: string; hidden: boolean } }> {
  return apiRequest<{ comment: { id: string; hidden: boolean } }>(
    `/api/comments/${encodeURIComponent(payload.commentId)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
