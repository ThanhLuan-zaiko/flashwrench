"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtimeTopic } from "@/hooks/useRealtimeTopic";
import { bookingTopic } from "@/lib/realtime/protocol";
import type {
  BookingListQuery,
  MechanicBookingAction,
  MechanicBookingSummary,
  UpdateLocationPayload,
} from "@/services/mechanic.api";
import {
  bookingActionRequest,
  fetchMechanicBooking,
  fetchMechanicBookings,
  fetchMechanicIncome,
  fetchMechanicStats,
  fetchNavigationBoard,
  updateMechanicLocationRequest,
} from "@/services/mechanic.api";

export const mechanicKeys = {
  all: ["mechanic"] as const,
  bookings: (query: BookingListQuery) =>
    ["mechanic", "bookings", query] as const,
  booking: (bookingId: string) =>
    ["mechanic", "booking", { bookingId }] as const,
  income: (limit?: number) => ["mechanic", "income", { limit }] as const,
  stats: ["mechanic", "stats"] as const,
  navigation: ["mechanic", "navigation"] as const,
};

// Workload refreshes fastest (the mechanic acts on it), money and stats
// stay cached longer because they only move after a job is finished.
export function useMechanicBookings(query: BookingListQuery = {}) {
  return useQuery({
    queryKey: mechanicKeys.bookings(query),
    queryFn: () => fetchMechanicBookings(query),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useMechanicBooking(bookingId: string | null) {
  return useQuery({
    queryKey: mechanicKeys.booking(bookingId ?? ""),
    queryFn: () => fetchMechanicBooking(bookingId as string),
    enabled: Boolean(bookingId),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useBookingRealtime(bookingId: string | null) {
  const queryClient = useQueryClient();
  useRealtimeTopic(bookingId ? bookingTopic(bookingId) : "", {
    enabled: Boolean(bookingId),
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: mechanicKeys.all });
    },
  });
}

export function useMechanicIncome(limit?: number) {
  return useQuery({
    queryKey: mechanicKeys.income(limit),
    queryFn: () => fetchMechanicIncome(limit),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useMechanicStats() {
  return useQuery({
    queryKey: mechanicKeys.stats,
    queryFn: fetchMechanicStats,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useNavigationBoard() {
  return useQuery({
    queryKey: mechanicKeys.navigation,
    queryFn: fetchNavigationBoard,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// One transition = instant local feedback (the summary status flips right
// away), then a full refetch: counters, income and the map all derive from
// the same booking state and must move together.
export function useBookingAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      action,
      note,
    }: {
      bookingId: string;
      action: MechanicBookingAction;
      note?: string;
    }) => bookingActionRequest(bookingId, action, note),
    onMutate: async ({ bookingId, action }) => {
      await queryClient.cancelQueries({ queryKey: mechanicKeys.all });
      const previous = new Map(
        queryClient
          .getQueriesData<{ bookings: MechanicBookingSummary[] }>({
            queryKey: ["mechanic", "bookings"],
          })
          .map(([key, data]) => [key, data]),
      );
      const optimistic: Record<MechanicBookingAction, string> = {
        accept: "mechanic_assigned",
        decline: "cancelled",
        "start-travel": "en_route",
        "start-work": "in_progress",
        complete: "completed",
        cancel: "cancelled",
        "mark-no-show": "no_show",
      };
      for (const [key, data] of previous) {
        if (!data?.bookings) continue;
        queryClient.setQueryData<{ bookings: MechanicBookingSummary[] }>(key, {
          bookings: data.bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: optimistic[action] as never }
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
      void queryClient.invalidateQueries({ queryKey: mechanicKeys.all });
    },
  });
}

export function useUpdateMechanicLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLocationPayload) =>
      updateMechanicLocationRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: mechanicKeys.navigation,
      });
    },
  });
}
