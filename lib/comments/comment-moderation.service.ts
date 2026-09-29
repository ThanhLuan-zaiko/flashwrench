// Staff moderation for comments: hide/unhide a top-level comment or a
// reply. Hidden rows drop out of the public feed but stay visible to
// moderators, and the parent's reply_count tracks only visible replies.
// The same realtime refresh as a new comment notifies current viewers.
import type { PublicUser } from "@/lib/auth/user.types";
import { isUuid } from "@/lib/validation";
import type {
  CommentFieldErrors,
  CommentResult,
  CommentTargetType,
} from "./comment.types";
import { canModerateComments, targetOwnerId } from "./comment-access";
import {
  findCommentLookup,
  findTopLevelLocation,
  indexCommentLookup,
  readCommentHidden,
  readReplyCount,
  setCommentHidden,
  updateReplyCount,
} from "./comments.repository";
import { publishComment } from "./comments.service";

export type CommentModerationAction = "hide" | "unhide";

export async function moderateComment(
  actor: PublicUser,
  commentId: unknown,
  raw: unknown,
): Promise<CommentResult<{ id: string; hidden: boolean }>> {
  if (!canModerateComments(actor)) {
    return fail(403, "Bạn không có quyền kiểm duyệt bình luận.");
  }
  const body =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const action = body.action;
  const errors: CommentFieldErrors = {};
  if (!isUuid(commentId)) errors.form = "Bình luận không hợp lệ.";
  if (action !== "hide" && action !== "unhide") {
    errors.action = "Hành động không hợp lệ.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 400, errors };
  }

  let lookup = await findCommentLookup(commentId as string);
  // Legacy rows predate comments_by_id: the caller's thread hint plus a
  // bounded partition scan locates them, then backfills the lookup.
  if (!lookup && isUuid(body.targetId) && typeof body.targetType === "string") {
    lookup = await findTopLevelLocation(
      body.targetType,
      body.targetId as string,
      commentId as string,
    );
    if (lookup) void indexCommentLookup(lookup);
  }
  if (!lookup || !lookup.created_at) {
    return fail(404, "Không tìm thấy bình luận.");
  }
  // Complaint threads stay admin-only end to end.
  if (lookup.target_type === "complaint" && actor.role !== "admin") {
    return fail(403, "Chỉ quản trị viên xử lý khiếu nại.");
  }

  const hidden = action === "hide";
  const current = await readCommentHidden(lookup);
  if (current !== hidden) {
    await setCommentHidden({ lookup, hidden, staffId: actor.id });
    // Keep the parent's visible reply count in sync.
    if (lookup.parent_id) {
      const parent = await findCommentLookup(lookup.parent_id);
      if (parent?.created_at) {
        const count =
          (await readReplyCount(
            parent.target_type,
            parent.target_id,
            parent.created_at,
            parent.comment_id,
          )) ?? 0;
        await updateReplyCount(
          parent.target_type,
          parent.target_id,
          parent.created_at,
          parent.comment_id,
          Math.max(0, count + (hidden ? -1 : 1)),
        );
      }
    }
  }

  const type = lookup.target_type as CommentTargetType;
  const owner =
    type === "part"
      ? null
      : ((await targetOwnerId(type, lookup.target_id)) ?? null);
  void publishComment(type, lookup.target_id, owner);

  return { ok: true, data: { id: lookup.comment_id, hidden } };
}

function fail<T>(status: number, form: string): CommentResult<T> {
  return { ok: false, status, errors: { form } };
}
