"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookingTracking, fetchOrderTracking } from "@/services/track.api";

export const trackKeys = {
  all: ["track"] as const,
  booking: (bookingId: string) => ["track", "booking", { bookingId }] as const,
  order: (orderId: string) => ["track", "order", { orderId }] as const,
};

const BOOKING_TERMINAL_STATUSES = new Set([
  "completed",
  "cancelled",
  "no_show",
]);
const ORDER_TERMINAL_STATUSES = new Set(["delivered", "cancelled", "refunded"]);

// Guest booking tracking: polls the public endpoint until the booking
// lands in a terminal state, then stops.
export function useBookingTracking(bookingId: string | null) {
  return useQuery({
    queryKey: trackKeys.booking(bookingId ?? ""),
    queryFn: () => fetchBookingTracking(bookingId as string),
    enabled: Boolean(bookingId),
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.tracking.status;
      return status && BOOKING_TERMINAL_STATUSES.has(status)
        ? false
        : 15 * 1000;
    },
    refetchOnWindowFocus: true,
  });
}

// Guest order tracking: same contract — poll while the order moves,
// stop when it is delivered, cancelled, or refunded.
export function useOrderTracking(orderId: string | null) {
  return useQuery({
    queryKey: trackKeys.order(orderId ?? ""),
    queryFn: () => fetchOrderTracking(orderId as string),
    enabled: Boolean(orderId),
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.tracking.status;
      return status && ORDER_TERMINAL_STATUSES.has(status) ? false : 15 * 1000;
    },
    refetchOnWindowFocus: true,
  });
}
