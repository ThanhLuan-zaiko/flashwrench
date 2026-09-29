// Row -> API item mapping shared by the thread list and the reply list.
import type { CommentItem, CommentRow } from "./comment.types";

export function toCommentItem(
  row: CommentRow,
  actorId: string | null,
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
    replyCount: row.reply_count ?? 0,
    hidden: row.is_hidden === true,
  };
}
