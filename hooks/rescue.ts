"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseDomainEvent, userTopic } from "@/lib/realtime/protocol";
import type { CreateRescueInput } from "@/services/rescue.api";
import {
  createRescueRequest,
  fetchMyRescueDetail,
  fetchMyRescues,
} from "@/services/rescue.api";
import { useMe } from "./auth";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const rescueKeys = {
  all: ["rescue"] as const,
  create: ["rescue", "create"] as const,
  mine: ["rescue", "mine"] as const,
  mineDetail: (requestId: string) =>
    ["rescue", "mine", "detail", { requestId }] as const,
};

// Public rescue creation. No optimistic update: dispatch needs the
// server-stored row first, so the form waits for 201 then shows the
// confirmation panel with the hotline hint.
export function useCreateRescue() {
  return useMutation({
    mutationFn: (payload: CreateRescueInput) => createRescueRequest(payload),
    retry: false,
  });
}

// /history/rescue: every request the signed-in customer filed.
export function useMyRescues() {
  const me = useMe();
  return useQuery({
    queryKey: rescueKeys.mine,
    queryFn: fetchMyRescues,
    enabled: me.data?.role === "customer",
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Customer-side detail: own rescue facts plus its status timeline.
export function useMyRescueDetail(requestId: string | null) {
  const me = useMe();
  return useQuery({
    queryKey: rescueKeys.mineDetail(requestId ?? ""),
    queryFn: () => fetchMyRescueDetail(requestId as string),
    enabled: me.data?.role === "customer" && Boolean(requestId),
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Rescue changes already fan out to the customer's user topic, so the
// history tab refreshes live with no reload.
export function useMyRescuesRealtime(enabled = true) {
  const me = useMe();
  const queryClient = useQueryClient();
  const userId = me.data?.id ?? "";
  useRealtimeTopic(userId ? userTopic(userId) : "", {
    enabled: enabled && me.data?.role === "customer",
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (!event || !event.kind.startsWith("rescue-")) return;
      void queryClient.invalidateQueries({ queryKey: rescueKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: rescueKeys.all });
    },
  });
}
