"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRealtimeTopic } from "@/hooks/useRealtimeTopic";
import {
  bookingTopic,
  OPERATIONS_TOPIC,
  parseDomainEvent,
} from "@/lib/realtime/protocol";
import type {
  BookingSummary,
  DispatchAction,
  DispatchListQuery,
} from "@/services/dispatch.api";
import {
  dispatchBookingAction,
  fetchDispatchBooking,
  fetchDispatchBookingTrack,
  fetchDispatchBookings,
} from "@/services/dispatch.api";

export const dispatchKeys = {
  all: ["dispatch"] as const,
  bookings: (query: DispatchListQuery) =>
    ["dispatch", "bookings", query] as const,
  booking: (bookingId: string) =>
    ["dispatch", "booking", { bookingId }] as const,
  travelTrack: (bookingId: string) =>
    ["dispatch", "travel-track", { bookingId }] as const,
};

type DispatchPage = { items: BookingSummary[]; nextCursor: string | null };

// The board is a live console: short stale time plus a 60s safety poll,
// while the operations topic pushes instant refreshes between ticks.
export function useDispatchBookings(query: DispatchListQuery) {
  return useQuery({
    queryKey: dispatchKeys.bookings(query),
    queryFn: () => fetchDispatchBookings(query),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useDispatchBooking(bookingId: string | null, live = false) {
  return useQuery({
    queryKey: dispatchKeys.booking(bookingId ?? ""),
    queryFn: () => fetchDispatchBooking(bookingId as string),
    enabled: Boolean(bookingId),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: live ? 15 * 1000 : 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useDispatchBookingTrack(
  bookingId: string | null,
  live = false,
) {
  return useQuery({
    queryKey: dispatchKeys.travelTrack(bookingId ?? ""),
    queryFn: () => fetchDispatchBookingTrack(bookingId as string),
    enabled: Boolean(bookingId),
    staleTime: live ? 5 * 1000 : 0,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchInterval: live ? 15 * 1000 : false,
    refetchOnWindowFocus: true,
  });
}

// Shared operations feed: every booking mutation publishes a domain event
// here, so the board and any open detail dialog refetch over the socket
// with no reload. `onNotice` receives parsed events for toast copy.
export function useDispatchOperations(
  onNotice?: (event: { kind: string; bookingId?: string }) => void,
) {
  const queryClient = useQueryClient();
  useRealtimeTopic(OPERATIONS_TOPIC, {
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (!event) return;
      void queryClient.invalidateQueries({ queryKey: dispatchKeys.all });
      onNotice?.(event);
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: dispatchKeys.all });
    },
  });
}

// Per-booking topic for the open detail dialog: status flips made by the
// mechanic or another dispatcher refresh the dialog in place.
export function useDispatchBookingRealtime(bookingId: string | null) {
  const queryClient = useQueryClient();
  useRealtimeTopic(bookingId ? bookingTopic(bookingId) : "", {
    enabled: Boolean(bookingId),
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: dispatchKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: dispatchKeys.all });
    },
  });
}

export function useDispatchAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      action,
      mechanicId,
      note,
      expectedUpdatedAt,
    }: {
      bookingId: string;
      action: DispatchAction;
      mechanicId?: string;
      // Display name of the picked mechanic, only for the optimistic flip.
      mechanicName?: string;
      note?: string;
      expectedUpdatedAt: string | null;
    }) =>
      dispatchBookingAction(bookingId, {
        action,
        mechanicId,
        note,
        expectedUpdatedAt,
      }),
    onMutate: async ({ bookingId, action, mechanicId, mechanicName }) => {
      await queryClient.cancelQueries({ queryKey: dispatchKeys.all });
      const previous = new Map(
        queryClient
          .getQueriesData<DispatchPage>({ queryKey: ["dispatch", "bookings"] })
          .map(([key, data]) => [key, data]),
      );
      const optimisticStatus: Record<DispatchAction, string> = {
        assign: "pending",
        confirm: "confirmed",
        cancel: "cancelled",
      };
      for (const [key, data] of previous) {
        if (!data?.items) continue;
        queryClient.setQueryData<DispatchPage>(key, {
          ...data,
          items: data.items.map((booking) =>
            booking.id === bookingId
              ? {
                  ...booking,
                  status: optimisticStatus[action] as never,
                  ...(action === "assign" && mechanicId
                    ? {
                        mechanicId,
                        mechanicName: mechanicName ?? booking.mechanicName,
                      }
                    : {}),
                  ...(action === "cancel" ? { mechanicId: null } : {}),
                }
              : booking,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      for (const [key, data] of context.previous) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dispatchKeys.all });
    },
  });
}
