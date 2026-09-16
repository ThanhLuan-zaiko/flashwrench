"use client";

import { useMutation } from "@tanstack/react-query";
import type { CreateBookingInput } from "@/services/booking.api";
import { createBookingRequest } from "@/services/booking.api";

export const bookingKeys = {
  all: ["bookings"] as const,
  create: ["bookings", "create"] as const,
};

// Customer booking creation. No optimistic update: a booking is a
// server-side transaction (price snapshot, denormalized copies), so the
// form waits for the 201 response and then shows the confirmation panel.
export function useCreateBooking() {
  return useMutation({
    mutationFn: (payload: CreateBookingInput) => createBookingRequest(payload),
    retry: false,
  });
}
