import type {
  OrderReviewState,
  PartReviewEligibility,
  ReviewItem,
} from "@/lib/reviews/review.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { OrderReviewState, PartReviewEligibility, ReviewItem };
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

export function fetchServiceReviews(
  serviceId: string,
  cursor?: string | null,
): Promise<{ reviews: ReviewPagePayload }> {
  const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest<{ reviews: ReviewPagePayload }>(
    `/api/services/${encodeURIComponent(serviceId)}/reviews${suffix}`,
  );
}

// Signed-in only: whether this customer may rate the product from its page.
export function fetchPartReviewEligibility(
  slug: string,
): Promise<{ eligibility: PartReviewEligibility }> {
  return apiRequest<{ eligibility: PartReviewEligibility }>(
    `/api/products/${encodeURIComponent(slug)}/reviews/eligibility`,
  );
}

// Staff moderation: hide/unhide a public review row in one feed
// (admin + dispatcher). targetType/targetId identify the projection row.
export function moderateReviewRequest(payload: {
  reviewId: string;
  targetType: "mechanic" | "part" | "service";
  targetId: string;
  action: "hide" | "unhide";
}): Promise<{ review: { id: string; hidden: boolean } }> {
  return apiRequest<{ review: { id: string; hidden: boolean } }>(
    `/api/reviews/${encodeURIComponent(payload.reviewId)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
