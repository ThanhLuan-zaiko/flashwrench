// Staff moderation for public reviews: hide/unhide a projected review row.
// Part reviews also un-count/re-count the rating counter and refresh the
// denormalized product rating; mechanic and service summaries rebuild
// from visible rows on each scan, so the flag alone is enough there.
import type { PublicUser } from "@/lib/auth/user.types";
import { partTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { isUuid } from "@/lib/validation";
import { refreshPartRating } from "./order-review.service";
import type {
  ReviewFieldErrors,
  ReviewResult,
  ReviewTargetType,
} from "./review.types";
import {
  bumpRatingCounter,
  findReviewProjection,
  findTargetReviewRowById,
  indexReviewProjection,
  readReviewHidden,
  setTargetReviewHidden,
} from "./reviews.repository";
import { canModerateReviews } from "./target-reviews.service";

export type ReviewModerationAction = "hide" | "unhide";

const MODERATED_TARGETS: ReviewTargetType[] = ["mechanic", "part", "service"];

function fail<T>(status: number, errors: ReviewFieldErrors): ReviewResult<T> {
  return { ok: false, status, errors };
}

export async function moderateReview(
  actor: PublicUser,
  reviewId: unknown,
  raw: unknown,
): Promise<ReviewResult<{ id: string; hidden: boolean }>> {
  if (!canModerateReviews(actor)) {
    return fail(403, { form: "Bạn không có quyền kiểm duyệt đánh giá." });
  }
  const body =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const errors: ReviewFieldErrors = {};
  if (!isUuid(reviewId)) errors.form = "Đánh giá không hợp lệ.";
  const targetType = body.targetType;
  const targetId = body.targetId;
  if (
    typeof targetType !== "string" ||
    !(MODERATED_TARGETS as string[]).includes(targetType)
  ) {
    errors.form = errors.form ?? "Khu vực đánh giá không hợp lệ.";
  }
  if (!isUuid(targetId)) errors.form = errors.form ?? "Đánh giá không hợp lệ.";
  const action = body.action;
  if (action !== "hide" && action !== "unhide") {
    errors.form = errors.form ?? "Hành động không hợp lệ.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, status: 400, errors };
  }

  let projection = await findReviewProjection(
    reviewId as string,
    targetType as string,
    targetId as string,
  );
  // Legacy rows predate reviews_by_id: scan the one target partition and
  // backfill the lookup so the next action hits it directly.
  if (!projection) {
    projection = await findTargetReviewRowById(
      targetType as string,
      targetId as string,
      reviewId as string,
    );
    if (projection) void indexReviewProjection(projection);
  }
  if (!projection?.created_at) {
    return fail(404, { form: "Không tìm thấy đánh giá." });
  }

  const hidden = action === "hide";
  const current = await readReviewHidden(projection);
  if (current !== hidden) {
    await setTargetReviewHidden({ projection, hidden, staffId: actor.id });
    if (projection.target_type === "part") {
      const rating = projection.rating ?? 0;
      // Un-count the review so the product rating matches the feed.
      await bumpRatingCounter(
        "part",
        projection.target_id,
        hidden ? -rating : rating,
        hidden ? -1 : 1,
      );
      await refreshPartRating(projection.target_id);
    }
  }

  if (projection.target_type === "part") {
    void publishRealtimeEvent(partTopic(projection.target_id), {
      kind: "part-updated",
      partId: projection.target_id,
    });
  }

  return { ok: true, data: { id: projection.review_id, hidden } };
}
