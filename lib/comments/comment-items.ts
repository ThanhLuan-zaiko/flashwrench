// Row -> API item mapping shared by the thread list and the reply list.
// Reply counts are read from the counter table by the caller, so they
// arrive as a parameter instead of a column on the row.
import type { CommentItem, CommentRow } from "./comment.types";

export function toCommentItem(
  row: CommentRow,
  actorId: string | null,
  replyCount = 0,
): CommentItem {
  const role = row.user_role ?? "customer";
  return {
    id: row.comment_id,
    userName: row.user_name ?? "Người dùng",
    userRole: role,
    body: row.body ?? "",
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    mine: actorId !== null && row.user_id === actorId,
    staff: role !== "customer",
    replyCount: Math.max(0, replyCount),
    hidden: row.is_hidden === true,
  };
}
