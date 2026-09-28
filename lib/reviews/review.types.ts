// Shared row/response shapes for the review domain. Reviews are claimed
// per source (booking/order/part-in-order/rescue) and projected onto
// reviews_by_target so mechanic and part pages can list them publicly.

export type ReviewTargetType = "mechanic" | "part";

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
};

export type OrderReviewState = {
  orderReview: ReviewItem | null;
  partReviews: Record<string, ReviewItem>;
};

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
