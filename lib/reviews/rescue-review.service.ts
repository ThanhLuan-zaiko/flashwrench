// Rescue reviews: a completed rescue request may be rated once by the
// requesting customer. The review targets the assigned mechanic so it
// feeds the same public rating as booking reviews.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import { isUuid } from "@/lib/validation";
import { handleVoucherReviewCreated } from "@/lib/vouchers/auto-grant.service";
import type { ReviewItem, ReviewResult } from "./review.types";
import { toIso } from "./review.types";
import { validateReviewInput } from "./review-validation";
import {
  claimRescueReview,
  findRescueReviewRow,
  projectTargetReview,
} from "./reviews.repository";

function fail<T>(status: number, form: string): ReviewResult<T> {
  return { ok: false, status, errors: { form } };
}

function toReviewItem(row: {
  review_id: string;
  rating: number | null;
  body: string | null;
  customer_name: string | null;
  created_at: Date | null;
}): ReviewItem {
  return {
    id: row.review_id,
    rating: row.rating ?? 0,
    body: row.body ?? "",
    customerName: row.customer_name ?? "",
    createdAt: toIso(row.created_at),
    hidden: false,
  };
}

export async function createRescueReview(
  customer: PublicUser,
  requestId: string,
  raw: unknown,
): Promise<ReviewResult<ReviewItem>> {
  if (!isUuid(requestId)) {
    return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  }
  const rescue = await findRescueRowById(requestId);
  if (!rescue || rescue.customer_id !== customer.id) {
    return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  }
  if (rescue.status !== "completed") {
    return fail(400, "Chỉ có thể đánh giá cứu hộ đã hoàn thành.");
  }
  if (!rescue.assigned_mechanic_id) {
    return fail(400, "Yêu cầu này không có thợ để đánh giá.");
  }
  const input = validateReviewInput(raw);
  if (input.errors) return { ok: false, status: 400, errors: input.errors };

  const existing = await findRescueReviewRow(requestId);
  if (existing) {
    return fail(409, "Yêu cầu cứu hộ này đã có đánh giá.");
  }

  const mechanicId = rescue.assigned_mechanic_id;
  const write = {
    requestId,
    reviewId: randomUUID(),
    customerId: customer.id,
    mechanicId,
    customerName: customer.fullName,
    rating: input.rating,
    body: input.body,
    createdAt: new Date(),
  };
  const claimed = await claimRescueReview(write);
  if (!claimed) {
    return fail(409, "Yêu cầu cứu hộ này đã có đánh giá.");
  }
  // Mechanic ratings aggregate live from reviews_by_target (same as
  // booking reviews), so only the public projection is written here.
  await projectTargetReview({
    targetType: "mechanic",
    targetId: mechanicId,
    reviewId: write.reviewId,
    customerId: write.customerId,
    customerName: write.customerName,
    rating: write.rating,
    body: write.body,
    createdAt: write.createdAt,
    rescueId: requestId,
  });
  void publishRescueChange(
    "rescue-updated",
    requestId,
    rescue.status ?? "completed",
    customer.id,
    [mechanicId],
    rescue.zone_id ?? null,
  );
  // Loyalty automation: a posted review may pay a voucher, deduped on the
  // rescue request id. Best-effort, never throws.
  await handleVoucherReviewCreated(customer.id, `rescue:${requestId}`).catch(
    () => undefined,
  );
  return {
    ok: true,
    data: {
      id: write.reviewId,
      rating: write.rating,
      body: write.body,
      customerName: write.customerName,
      createdAt: write.createdAt.toISOString(),
      hidden: false,
    },
  };
}

// Owner reads the current rescue review state for the detail dialog.
// Ownership is checked on the rescue row itself so a missing review
// never leaks whether the request exists.
export async function getRescueReview(
  customer: PublicUser,
  requestId: string,
): Promise<ReviewResult<{ review: ReviewItem | null }>> {
  if (!isUuid(requestId)) {
    return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  }
  const rescue = await findRescueRowById(requestId);
  if (!rescue || rescue.customer_id !== customer.id) {
    return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  }
  const review = await findRescueReviewRow(requestId);
  return {
    ok: true,
    data: { review: review ? toReviewItem(review) : null },
  };
}
