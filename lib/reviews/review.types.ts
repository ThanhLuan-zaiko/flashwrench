// Shared row/response shapes for the review domain. Reviews are claimed
// per source (booking/order/part-in-order/rescue) and projected onto
// reviews_by_target so mechanic and part pages can list them publicly.

export type ReviewTargetType = "mechanic" | "part" | "service";

export type TargetReviewRow = {
  target_type: string;
  target_id: string;
  created_at: Date | null;
  review_id: string;
  customer_id: string | null;
  customer_name: string | null;
  booking_id: string | null;
  order_id: string | null;
  rescue_id: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  is_hidden: boolean | null;
};

// reviews_by_id lookup: where a review's public projection row lives so
// staff can hide it without knowing the partition keys.
export type ReviewProjectionRow = {
  review_id: string;
  target_type: string;
  target_id: string;
  created_at: Date | null;
  rating: number | null;
};

// Claim rows: one review per source entity.
export type OrderReviewRow = {
  order_id: string;
  review_id: string;
  customer_id: string | null;
  customer_name: string | null;
  rating: number | null;
  body: string | null;
  created_at: Date | null;
};

export type OrderPartReviewRow = OrderReviewRow & { part_id: string };

export type RescueReviewRow = {
  request_id: string;
  review_id: string;
  customer_id: string | null;
  mechanic_id: string | null;
  customer_name: string | null;
  rating: number | null;
  body: string | null;
  created_at: Date | null;
};

// API-facing item shapes.
export type ReviewItem = {
  id: string;
  rating: number;
  body: string;
  customerName: string;
  createdAt: string | null;
  hidden: boolean;
};

export type OrderReviewState = {
  orderReview: ReviewItem | null;
  partReviews: Record<string, ReviewItem>;
};

// Whether the signed-in customer may rate a part from its product page:
// only through a delivered order that contains it and has no part review yet.
export type PartReviewEligibility =
  | { status: "eligible"; orderId: string; partId: string }
  | { status: "reviewed"; review: ReviewItem }
  | { status: "not_purchased" };

export type RatingCounterRow = {
  total_score: number | null;
  total_count: number | null;
};

export type ReviewFieldErrors = Partial<
  Record<"rating" | "body" | "partId" | "form", string>
>;

export type ReviewResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: ReviewFieldErrors };

export type ReviewPage = {
  items: ReviewItem[];
  nextCursor: string | null;
};

export function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function toReviewItem(row: {
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
