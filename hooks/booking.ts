"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CreateBookingInput } from "@/services/booking.api";
import {
  createBookingRequest,
  fetchBookingTravelPoints,
  fetchLastBooking,
  fetchMyBooking,
  fetchMyBookings,
} from "@/services/booking.api";
import type { MechanicsQuery } from "@/services/mechanics.api";
import { fetchAvailableMechanics } from "@/services/mechanics.api";

export const bookingKeys = {
  all: ["bookings"] as const,
  create: ["bookings", "create"] as const,
  last: ["bookings", "last"] as const,
  mine: ["bookings", "mine"] as const,
  detail: (bookingId: string) => ["bookings", "detail", bookingId] as const,
  travelTrack: (bookingId: string) =>
    ["bookings", "travel-track", bookingId] as const,
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
// cache: it only shifts when a new booking is created.
export function useLastBooking() {
  return useQuery({
    queryKey: bookingKeys.last,
    queryFn: fetchLastBooking,
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
