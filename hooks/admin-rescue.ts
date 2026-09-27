"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminZone,
  fetchAdminZones,
  fetchDispatchConfig,
  type SlaPayload,
  updateAdminZone,
  updateDispatchConfig,
  type ZonePayload,
} from "@/services/admin-rescue.api";

export const adminRescueKeys = {
  all: ["admin-rescue"] as const,
  zones: ["admin-rescue", "zones"] as const,
  sla: ["admin-rescue", "sla"] as const,
};

export function useAdminZones() {
  return useQuery({
    queryKey: adminRescueKeys.zones,
    queryFn: fetchAdminZones,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      zoneId,
      payload,
    }: {
      zoneId?: string;
      payload: ZonePayload;
    }) =>
      zoneId ? updateAdminZone(zoneId, payload) : createAdminZone(payload),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminRescueKeys.zones });
    },
  });
}

export function useDispatchSla() {
  return useQuery({
    queryKey: adminRescueKeys.sla,
    queryFn: fetchDispatchConfig,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSlaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SlaPayload) => updateDispatchConfig(payload),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminRescueKeys.sla });
    },
  });
}
