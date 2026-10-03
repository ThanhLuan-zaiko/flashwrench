"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  BookingReviewPayload,
  CreateBookingInput,
} from "@/services/booking.api";
import {
  cancelBookingRequest,
  createBookingRequest,
  createBookingReviewRequest,
  fetchBookingTravelPoints,
  fetchLastBooking,
  fetchMyBooking,
  fetchMyBookings,
} from "@/services/booking.api";
import type { MechanicsQuery } from "@/services/mechanics.api";
import { fetchAvailableMechanics } from "@/services/mechanics.api";
import { reviewKeys } from "./reviews";

export const bookingKeys = {
  all: ["bookings"] as const,
  create: ["bookings", "create"] as const,
  last: ["bookings", "last"] as const,
  mine: ["bookings", "mine"] as const,
  detail: (bookingId: string) => ["bookings", "detail", bookingId] as const,
  travelTrack: (bookingId: string) =>
    ["bookings", "travel-track", bookingId] as const,
  mechanicsAll: ["bookings", "mechanics"] as const,
  mechanics: (query: MechanicsQuery) =>
    ["bookings", "mechanics", query] as const,
};

// Customer booking creation. No optimistic update: a booking is a
// server-side transaction (price snapshot, denormalized copies), so the
// form waits for the 201 response and then shows the confirmation panel.
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingInput) => createBookingRequest(payload),
    retry: false,
    // The saved snapshot and customer history change when a booking lands.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.last });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
    },
  });
}

// The customer's most recent booking for quick-rebook prefill. Longer
// cache: it only shifts when a new booking is created. Guests hold no
// history, so the caller disables it for them.
export function useLastBooking(enabled = true) {
  return useQuery({
    queryKey: bookingKeys.last,
    queryFn: fetchLastBooking,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// Customer booking history, cursor-paged. Realtime user-topic events
// invalidate the whole list so new transitions surface without polling.
export function useMyBookings(search = "") {
  return useInfiniteQuery({
    queryKey: [...bookingKeys.mine, { search }],
    queryFn: ({ pageParam }) => fetchMyBookings(pageParam, search),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// One owned booking detail (timeline + live mechanic pin). The live pin
// rides on the same user-topic invalidation; a short poll keeps the map
// moving even if a socket event is missed.
export function useMyBooking(bookingId: string | null, live = false) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId ?? ""),
    queryFn: () => fetchMyBooking(bookingId as string),
    enabled: bookingId !== null,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchInterval: live ? 15 * 1000 : false,
  });
}

// Review submission for a completed booking; refreshes the detail so the
// saved review replaces the form without a reload.
export function useCreateBookingReview(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookingReviewPayload) =>
      createBookingReviewRequest(bookingId, payload),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(bookingId),
      });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
      // Public mechanic/service feeds and ratings pick up the new review.
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.mechanicsAll,
      });
    },
  });
}

// Customer cancel: only pending/confirmed/mechanic_assigned qualify (the
// service enforces it). Success refreshes the open detail dialog and the
// history list so the cancelled chip lands without a reload.
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { bookingId: string; note: string }) =>
      cancelBookingRequest(input.bookingId, input.note),
    retry: false,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.detail(input.bookingId),
      });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
    },
  });
}

export function useBookingTravelPoints(bookingId: string | null, live = false) {
  return useQuery({
    queryKey: bookingKeys.travelTrack(bookingId ?? ""),
    queryFn: () => fetchBookingTravelPoints(bookingId as string),
    enabled: bookingId !== null,
    staleTime: live ? 5 * 1000 : 0,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchInterval: live ? 15 * 1000 : false,
  });
}

// Bookable mechanics for the picker. Short cache: availability flips the
// moment a mechanic takes a job, and lat/lng re-sorts nearest-first.
export function useAvailableMechanics(query: MechanicsQuery = {}) {
  return useQuery({
    queryKey: bookingKeys.mechanics(query),
    queryFn: () => fetchAvailableMechanics(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}
