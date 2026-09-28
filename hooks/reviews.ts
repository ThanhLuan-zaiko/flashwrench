import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrderPartReviewRequest,
  createOrderReviewRequest,
  createRescueReviewRequest,
  fetchMechanicReviews,
  fetchOrderReviews,
  fetchProductReviews,
  fetchRescueReview,
} from "@/services/reviews.api";

export const reviewKeys = {
  all: ["reviews"] as const,
  order: (orderId: string) => ["reviews", "order", orderId] as const,
  rescue: (requestId: string) => ["reviews", "rescue", requestId] as const,
  product: (slug: string) => ["reviews", "product", slug] as const,
  mechanic: (mechanicId: string) =>
    ["reviews", "mechanic", mechanicId] as const,
};

// Owner-side order review state: overall review + per-part map.
export function useOrderReviews(orderId: string | null) {
  return useQuery({
    queryKey: reviewKeys.order(orderId ?? "none"),
    queryFn: () => fetchOrderReviews(orderId as string),
    enabled: Boolean(orderId),
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateOrderReview(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; body?: string }) =>
      createOrderReviewRequest(orderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reviewKeys.order(orderId),
      });
    },
  });
}

export function useCreateOrderPartReview(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      partId,
      rating,
      body,
    }: {
      partId: string;
      rating: number;
      body?: string;
    }) => createOrderPartReviewRequest(orderId, partId, { rating, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reviewKeys.order(orderId),
      });
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

// Rescue review state for the requesting customer.
export function useRescueReview(requestId: string | null) {
  return useQuery({
    queryKey: reviewKeys.rescue(requestId ?? "none"),
    queryFn: () => fetchRescueReview(requestId as string),
    enabled: Boolean(requestId),
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateRescueReview(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; body?: string }) =>
      createRescueReviewRequest(requestId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reviewKeys.rescue(requestId),
      });
    },
  });
}

// Public feeds: product page and mechanic profile. The cursor comes from
// the caller, which keeps the page stack for Trước/Sau paging.
export function useProductReviews(slug: string | null, cursor?: string | null) {
  return useQuery({
    queryKey: [...reviewKeys.product(slug ?? "none"), cursor ?? null],
    queryFn: () => fetchProductReviews(slug as string, cursor),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useMechanicReviews(
  mechanicId: string | null,
  cursor?: string | null,
) {
  return useQuery({
    queryKey: [...reviewKeys.mechanic(mechanicId ?? "none"), cursor ?? null],
    queryFn: () => fetchMechanicReviews(mechanicId as string, cursor),
    enabled: Boolean(mechanicId),
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
