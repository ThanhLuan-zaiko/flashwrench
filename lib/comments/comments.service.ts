// Comment threads: one discussion area per entity. Part threads are
// public (read without login, write requires an account). Booking,
// order, rescue and complaint threads stay between the owner and staff.
// Replies and staff moderation live in comment-replies.service.ts and
// comment-moderation.service.ts; shared access rules sit in
// comment-access.ts.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import {
  COMPLAINTS_TOPIC,
  OPERATIONS_TOPIC,
  partTopic,
  userTopic,
} from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import type {
  CommentItem,
  CommentLookupRow,
  CommentPage,
  CommentResult,
  CommentTargetType,
} from "./comment.types";
import {
  canReadCommentThread,
  canWriteComment,
  targetOwnerId,
  visibleCommentRows,
} from "./comment-access";
import { toCommentItem } from "./comment-items";
import {
  validateCommentBody,
  validateCommentTarget,
  validateParentId,
} from "./comment-validation";
import {
  findCommentLookup,
  findTopLevelLocation,
  indexCommentLookup,
  insertComment,
  insertReply,
  listCommentRows,
  readReplyCount,
  updateReplyCount,
} from "./comments.repository";

const COMMENT_PAGE = 10;

function fail<T>(status: number, form: string): CommentResult<T> {
  return { ok: false, status, errors: { form } };
}

function commentCursorScope(targetType: string, targetId: string): string {
  return `comments:${targetType}:${targetId}`;
}

export async function listComments(
  actor: PublicUser | null,
  targetType: unknown,
  targetId: unknown,
  cursor: string | null | undefined,
): Promise<CommentResult<CommentPage>> {
  const targetError = validateCommentTarget(targetType, targetId);
  if (targetError)
    return { ok: false, status: 400, errors: targetError.errors };
  const type = targetType as CommentTargetType;
  const id = targetId as string;

  const access = await canReadCommentThread(actor, type, id);
  if (access === "not-found") return fail(404, "Không tìm thấy mục này.");
  if (access === "forbidden") {
    return fail(403, "Bạn không có quyền xem bình luận này.");
  }

  const scope = commentCursorScope(type, id);
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(cursor ?? null, scope);
  } catch {
    return fail(400, "Con trỏ phân trang không hợp lệ.");
  }
  const page = await listCommentRows(type, id, COMMENT_PAGE, pageState);
  return {
    ok: true,
    data: {
      items: visibleCommentRows(page.rows, actor).map((row) =>
        toCommentItem(row, actor?.id ?? null),
      ),
      nextCursor: encodeCursor(page.pageState, scope),
    },
  };
}

// Notify the counterpart so threads refresh live: customer posts reach
// the staff board, staff replies reach the owner's user topic. Part
// threads are public Q&A, so they fan out to the part topic instead and
// leave the staff board quiet.
export async function publishComment(
  targetType: CommentTargetType,
  targetId: string,
  ownerId: string | null,
): Promise<void> {
  if (targetType === "part") {
    await publishRealtimeEvent(partTopic(targetId), {
      kind: "part-updated",
      partId: targetId,
    });
    return;
  }
  const kind =
    targetType === "complaint"
      ? "complaint-updated"
      : targetType === "rescue"
        ? "rescue-updated"
        : targetType === "order"
          ? "order-updated"
          : "booking-updated";
  const topics = new Set<string>([OPERATIONS_TOPIC]);
  if (ownerId) topics.add(userTopic(ownerId));
  if (targetType === "complaint") topics.add(COMPLAINTS_TOPIC);
  const payload: Record<string, string> = {};
  if (targetType === "booking") payload.bookingId = targetId;
  if (targetType === "order") payload.orderId = targetId;
  if (targetType === "rescue") payload.rescueId = targetId;
  if (targetType === "complaint") payload.complaintId = targetId;
  await Promise.all(
    [...topics].map((topic) =>
      publishRealtimeEvent(topic, { kind, ...payload }),
    ),
  );
}

export async function addComment(
  actor: PublicUser,
  targetType: unknown,
  targetId: unknown,
  raw: unknown,
): Promise<CommentResult<CommentItem>> {
  const targetError = validateCommentTarget(targetType, targetId);
  if (targetError)
    return { ok: false, status: 400, errors: targetError.errors };
  const type = targetType as CommentTargetType;
  const id = targetId as string;

  const rawRecord =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
  const bodyError = rawRecord
    ? validateCommentBody(rawRecord.body)
    : {
        body: "",
        errors: { body: "Nội dung bình luận không được để trống." },
      };
  if (bodyError.errors)
    return { ok: false, status: 400, errors: bodyError.errors };

  // Replies attach to a top-level comment in the same thread; two levels
  // max, so a reply (parent_id set) cannot be replied to.
  let parent: CommentLookupRow | null = null;
  if (rawRecord) {
    const parsed = validateParentId(rawRecord.parentId);
    if (parsed.errors) return { ok: false, status: 400, errors: parsed.errors };
    if (parsed.parentId) {
      parent = await findCommentLookup(parsed.parentId);
      // Legacy rows predate comments_by_id: a bounded partition scan
      // finds them, then backfills the lookup for next time.
      if (!parent) {
        parent = await findTopLevelLocation(type, id, parsed.parentId);
        if (parent) void indexCommentLookup(parent);
      }
      if (!parent || parent.target_type !== type || parent.target_id !== id) {
        return fail(404, "Không tìm thấy bình luận gốc.");
      }
      if (parent.parent_id) {
        return fail(400, "Chỉ được phản hồi bình luận gốc.");
      }
    }
  }

  const access = await canWriteComment(actor, type, id);
  if (access === "not-found") return fail(404, "Không tìm thấy mục này.");
  if (access === "forbidden") {
    return fail(403, "Bạn không có quyền bình luận ở đây.");
  }

  const write = {
    targetType: type,
    targetId: id,
    commentId: randomUUID(),
    userId: actor.id,
    userName: actor.fullName,
    userRole: actor.role,
    body: bodyError.body,
    createdAt: new Date(),
  };
  // Every new row is indexed so moderation and reply listing can locate
  // it by comment_id alone, without the caller's thread hint.
  const lookup: CommentLookupRow = {
    comment_id: write.commentId,
    target_type: type,
    target_id: id,
    parent_id: parent?.comment_id ?? null,
    created_at: write.createdAt,
  };
  if (parent) {
    await insertReply({ ...write, parentId: parent.comment_id });
    void indexCommentLookup(lookup);
    // reply_count tracks visible replies; hide/unhide re-adjusts it.
    const current = parent.created_at
      ? ((await readReplyCount(
          type,
          id,
          parent.created_at,
          parent.comment_id,
        )) ?? 0)
      : 0;
    await updateReplyCount(
      type,
      id,
      parent.created_at as Date,
      parent.comment_id,
      current + 1,
    );
  } else {
    await insertComment(write);
    void indexCommentLookup(lookup);
  }

  const owner = type === "part" ? null : await targetOwnerId(type, id);
  void publishComment(type, id, owner ?? null);

  return {
    ok: true,
    data: {
      id: write.commentId,
      userName: write.userName,
      userRole: write.userRole,
      body: write.body,
      createdAt: write.createdAt.toISOString(),
      mine: true,
      staff: write.userRole !== "customer",
      replyCount: 0,
      hidden: false,
    },
  };
}
