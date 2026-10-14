"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtimeTopic } from "@/hooks/useRealtimeTopic";
import {
  bookingTrackTopic,
  orderTopic,
  parseDomainEvent,
} from "@/lib/realtime/protocol";
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

// Guest booking tracking: live over the public booking-track topic (the
// unguessable id is the capability, same as the HTTP endpoint) with the
// 15s poll kept as a safety net for missed socket events or a down
// gateway. Stops both once the booking lands in a terminal state.
export function useBookingTracking(bookingId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
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
  useRealtimeTopic(bookingId ? bookingTrackTopic(bookingId) : "", {
    enabled: Boolean(bookingId),
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (!event) return;
      if (event.bookingId && event.bookingId !== bookingId) return;
      void queryClient.invalidateQueries({
        queryKey: trackKeys.booking(bookingId as string),
      });
    },
    onReconnect: () => {
      if (!bookingId) return;
      void queryClient.invalidateQueries({
        queryKey: trackKeys.booking(bookingId),
      });
    },
  });
  return query;
}

// Guest order tracking: same contract — live over the public order topic,
// poll as fallback, stop when delivered, cancelled, or refunded.
export function useOrderTracking(orderId: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
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
  useRealtimeTopic(orderId ? orderTopic(orderId) : "", {
    enabled: Boolean(orderId),
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (!event) return;
      if (event.orderId && event.orderId !== orderId) return;
      void queryClient.invalidateQueries({
        queryKey: trackKeys.order(orderId as string),
      });
    },
    onReconnect: () => {
      if (!orderId) return;
      void queryClient.invalidateQueries({
        queryKey: trackKeys.order(orderId),
      });
    },
  });
  return query;
}
