"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BOOKING_CONFIG_TOPIC } from "@/lib/realtime/protocol";
import {
  type BookingConfigPayload,
  fetchAdminBookingConfig,
  fetchPublicBookingConfig,
  updateAdminBookingConfig,
} from "@/services/booking-config.api";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const bookingConfigKeys = {
  public: ["booking-config", "public"] as const,
  admin: ["booking-config", "admin"] as const,
};

// The booking form's lead-time floor. Rarely changes, but a stale read is
// harmless: submit-time server validation re-checks the live value.
export function usePublicBookingConfig() {
  return useQuery({
    queryKey: bookingConfigKeys.public,
    queryFn: fetchPublicBookingConfig,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminBookingConfig() {
  return useQuery({
    queryKey: bookingConfigKeys.admin,
    queryFn: fetchAdminBookingConfig,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useBookingConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookingConfigPayload) =>
      updateAdminBookingConfig(payload),
    onSettled: () => {
      // A new floor must reach open booking forms, not just the admin card.
      void queryClient.invalidateQueries({ queryKey: bookingConfigKeys.admin });
      void queryClient.invalidateQueries({
        queryKey: bookingConfigKeys.public,
      });
    },
  });
}

// Invalidate both config reads whenever an admin retunes the intake floor.
// The topic is public so guest booking forms see the new floor too; events
// carry only a refresh signal and the value refetches over HTTPS.
export function useBookingConfigRealtime(enabled = true) {
  const queryClient = useQueryClient();
  useRealtimeTopic(BOOKING_CONFIG_TOPIC, {
    enabled,
    onEvent: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingConfigKeys.public,
      });
      void queryClient.invalidateQueries({ queryKey: bookingConfigKeys.admin });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({
        queryKey: bookingConfigKeys.public,
      });
      void queryClient.invalidateQueries({ queryKey: bookingConfigKeys.admin });
    },
  });
}
