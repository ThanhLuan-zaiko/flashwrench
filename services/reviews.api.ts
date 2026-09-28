import type { OrderReviewState, ReviewItem } from "@/lib/reviews/review.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { OrderReviewState, ReviewItem };
export { AuthApiError };

export type ReviewPagePayload = {
  items: ReviewItem[];
  nextCursor: string | null;
  ratingAvg: number;
  ratingCount: number;
};

// Owner-side order reviews: one overall review plus one per part.
export function fetchOrderReviews(
  orderId: string,
): Promise<{ state: OrderReviewState }> {
  return apiRequest<{ state: OrderReviewState }>(
    `/api/orders/${encodeURIComponent(orderId)}/reviews`,
  );
}

export function createOrderReviewRequest(
  orderId: string,
  payload: { rating: number; body?: string },
): Promise<{ review: ReviewItem }> {
  return apiRequest<{ review: ReviewItem }>(
    `/api/orders/${encodeURIComponent(orderId)}/reviews`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function createOrderPartReviewRequest(
  orderId: string,
  partId: string,
  payload: { rating: number; body?: string },
): Promise<{ review: ReviewItem }> {
  return apiRequest<{ review: ReviewItem }>(
    `/api/orders/${encodeURIComponent(orderId)}/reviews/${encodeURIComponent(partId)}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

// Rescue review: one review per completed request targeting the mechanic.
export function fetchRescueReview(
  requestId: string,
): Promise<{ state: { review: ReviewItem | null } }> {
  return apiRequest<{ state: { review: ReviewItem | null } }>(
    `/api/rescue/${encodeURIComponent(requestId)}/review`,
  );
}

export function createRescueReviewRequest(
  requestId: string,
  payload: { rating: number; body?: string },
): Promise<{ review: ReviewItem }> {
  return apiRequest<{ review: ReviewItem }>(
    `/api/rescue/${encodeURIComponent(requestId)}/review`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

// Public review feeds on the product page and the mechanic profile.
export function fetchProductReviews(
  slug: string,
  cursor?: string | null,
): Promise<{ reviews: ReviewPagePayload }> {
  const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest<{ reviews: ReviewPagePayload }>(
    `/api/products/${encodeURIComponent(slug)}/reviews${suffix}`,
  );
}

export function fetchMechanicReviews(
  mechanicId: string,
  cursor?: string | null,
): Promise<{ reviews: ReviewPagePayload }> {
  const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest<{ reviews: ReviewPagePayload }>(
    `/api/mechanics/${encodeURIComponent(mechanicId)}/reviews${suffix}`,
  );
}
