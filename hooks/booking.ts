"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateBookingInput } from "@/services/booking.api";
import { createBookingRequest, fetchLastBooking } from "@/services/booking.api";
import type { MechanicsQuery } from "@/services/mechanics.api";
import { fetchAvailableMechanics } from "@/services/mechanics.api";

export const bookingKeys = {
  all: ["bookings"] as const,
  create: ["bookings", "create"] as const,
  last: ["bookings", "last"] as const,
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
    // The saved snapshot changes the moment a booking lands.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: bookingKeys.last }),
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
