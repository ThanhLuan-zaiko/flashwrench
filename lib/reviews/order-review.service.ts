// Order-level and per-part reviews. A delivered order may receive one
// overall experience review plus one review per purchased part; part
// reviews feed the public product rating on /products/[slug].
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import {
  findOrderRowById,
  listOrderItemRows,
} from "@/lib/orders/orders.repository";
import { findPartRowById } from "@/lib/parts/parts.repository";
import { isUuid } from "@/lib/validation";
import type {
  OrderReviewRow,
  OrderReviewState,
  ReviewItem,
  ReviewResult,
} from "./review.types";
import { toIso } from "./review.types";
import { validateReviewInput } from "./review-validation";
import {
  bumpRatingCounter,
  claimOrderPartReview,
  claimOrderReview,
  findOrderReviewRow,
  listOrderPartReviewRows,
  projectTargetReview,
  readRatingCounter,
  updatePartRating,
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
  };
}

// The order must belong to the caller and be delivered before reviews open.
async function reviewableOrder(
  customer: PublicUser,
  orderId: string,
): Promise<
  | {
      ok: true;
      order: NonNullable<Awaited<ReturnType<typeof findOrderRowById>>>;
    }
  | { ok: false; result: ReviewResult<never> }
> {
  if (!isUuid(orderId)) {
    return { ok: false, result: fail(400, "Mã đơn hàng không hợp lệ.") };
  }
  const order = await findOrderRowById(orderId);
  if (!order || order.customer_id !== customer.id) {
    return { ok: false, result: fail(404, "Không tìm thấy đơn hàng này.") };
  }
  if (order.status !== "delivered") {
    return {
      ok: false,
      result: fail(400, "Chỉ có thể đánh giá đơn đã giao thành công."),
    };
  }
  return { ok: true, order };
}

// Refresh the denormalized rating on the part card/detail rows right
// after the counter bump so product pages show the new score.
async function refreshPartRating(partId: string): Promise<void> {
  const counter = await readRatingCounter("part", partId);
  const count = counter?.total_count ?? 0;
  if (count <= 0) return;
  const avg = Math.round(((counter?.total_score ?? 0) / count) * 10) / 10;
  const part = await findPartRowById(partId);
  await updatePartRating({
    partId,
    categoryId: part?.category_id ?? null,
    categoryCreatedAt: part?.created_at ?? null,
    ratingAvg: avg,
    ratingCount: count,
  });
}

// Overall purchase-experience review: shipping, packing, support.
// Projects under target 'order' so the customer's history indexes it.
export async function createOrderReview(
  customer: PublicUser,
  orderId: string,
  raw: unknown,
): Promise<ReviewResult<ReviewItem>> {
  const gate = await reviewableOrder(customer, orderId);
  if (!gate.ok) return gate.result;
  const input = validateReviewInput(raw);
  if (input.errors) return { ok: false, status: 400, errors: input.errors };

  const existing = await findOrderReviewRow(orderId);
  if (existing) {
    return fail(409, "Đơn này đã có đánh giá.");
  }

  const write = {
    orderId,
    reviewId: randomUUID(),
    customerId: customer.id,
    customerName: customer.fullName,
    rating: input.rating,
    body: input.body,
    createdAt: new Date(),
  };
  const claimed = await claimOrderReview(write);
  if (!claimed) {
    return fail(409, "Đơn này đã có đánh giá.");
  }
  await projectTargetReview({
    targetType: "order",
    targetId: orderId,
    reviewId: write.reviewId,
    customerId: write.customerId,
    customerName: write.customerName,
    rating: write.rating,
    body: write.body,
    createdAt: write.createdAt,
    orderId,
  });
  return {
    ok: true,
    data: {
      id: write.reviewId,
      rating: write.rating,
      body: write.body,
      customerName: write.customerName,
      createdAt: write.createdAt.toISOString(),
    },
  };
}

// Per-part review: the part must appear inside the delivered order.
// Projects under target 'part' and refreshes the public product rating.
export async function createOrderPartReview(
  customer: PublicUser,
  orderId: string,
  partId: string,
  raw: unknown,
): Promise<ReviewResult<ReviewItem>> {
  const gate = await reviewableOrder(customer, orderId);
  if (!gate.ok) return gate.result;
  if (!isUuid(partId)) {
    return fail(400, "Linh kiện cần đánh giá không hợp lệ.");
  }
  const items = await listOrderItemRows(orderId);
  if (!items.some((item) => item.part_id === partId)) {
    return fail(400, "Linh kiện này không nằm trong đơn hàng.");
  }
  const input = validateReviewInput(raw);
  if (input.errors) return { ok: false, status: 400, errors: input.errors };

  const existing = (await listOrderPartReviewRows(orderId)).find(
    (row) => row.part_id === partId,
  );
  if (existing) {
    return fail(409, "Linh kiện này trong đơn đã có đánh giá.");
  }

  const write = {
    orderId,
    partId,
    reviewId: randomUUID(),
    customerId: customer.id,
    customerName: customer.fullName,
    rating: input.rating,
    body: input.body,
    createdAt: new Date(),
  };
  const claimed = await claimOrderPartReview(write);
  if (!claimed) {
    return fail(409, "Linh kiện này trong đơn đã có đánh giá.");
  }
  await projectTargetReview({
    targetType: "part",
    targetId: partId,
    reviewId: write.reviewId,
    customerId: write.customerId,
    customerName: write.customerName,
    rating: write.rating,
    body: write.body,
    createdAt: write.createdAt,
    orderId,
  });
  await bumpRatingCounter("part", partId, write.rating);
  await refreshPartRating(partId);
  return {
    ok: true,
    data: {
      id: write.reviewId,
      rating: write.rating,
      body: write.body,
      customerName: write.customerName,
      createdAt: write.createdAt.toISOString(),
    },
  };
}

// Owner reads the review state of one order for the detail page.
export async function getOrderReviews(
  customer: PublicUser,
  orderId: string,
): Promise<ReviewResult<OrderReviewState>> {
  if (!isUuid(orderId)) {
    return fail(400, "Mã đơn hàng không hợp lệ.");
  }
  const order = await findOrderRowById(orderId);
  if (!order || order.customer_id !== customer.id) {
    return fail(404, "Không tìm thấy đơn hàng này.");
  }
  const [orderRow, partRows] = await Promise.all([
    findOrderReviewRow(orderId),
    listOrderPartReviewRows(orderId),
  ]);
  const partReviews: Record<string, ReviewItem> = {};
  for (const row of partRows) partReviews[row.part_id] = toReviewItem(row);
  return {
    ok: true,
    data: {
      orderReview: orderRow ? toReviewItem(orderRow as OrderReviewRow) : null,
      partReviews,
    },
  };
}
