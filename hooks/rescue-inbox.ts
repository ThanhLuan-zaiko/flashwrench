"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRealtimeTopic } from "@/hooks/useRealtimeTopic";
import {
  OPERATIONS_TOPIC,
  parseDomainEvent,
  userTopic,
} from "@/lib/realtime/protocol";
import {
  parseRescueInboxEvent,
  type RescueInboxEvent,
} from "@/lib/realtime/rescue-inbox-protocol";
import type { RescueDetail } from "@/services/rescue-mechanic.api";
import {
  type DispatchRescueActionBody,
  dispatchRescueActionRequest,
  fetchDispatchRescueDetail,
  fetchDispatchRescues,
  fetchMechanicRescues,
  issueRescuePaymentCodeRequest,
  type MechanicRescueAction,
  type RescuePaymentInput,
  recordRescuePaymentRequest,
  rescueActionRequest,
  rescueExpireRequest,
} from "@/services/rescue-mechanic.api";

export const rescueInboxKeys = {
  all: ["rescue-inbox"] as const,
  mechanic: ["rescue-inbox", "mechanic"] as const,
  detail: (requestId: string) =>
    ["rescue-inbox", "detail", { requestId }] as const,
  dispatch: (status: string, cursor: string | null) =>
    ["rescue-inbox", "dispatch", { status, cursor }] as const,
};

// Mechanic inbox: invalidates on every rescue offer so the 30s card
// appears with no reload. The countdown lives in the card component.
export function useMechanicRescues() {
  return useQuery({
    queryKey: rescueInboxKeys.mechanic,
    queryFn: fetchMechanicRescues,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useRescueInbox(
  mechanicId: string | null,
  onNotice?: (event: RescueInboxEvent) => void,
) {
  const queryClient = useQueryClient();
  useRealtimeTopic(mechanicId ? userTopic(mechanicId) : "", {
    enabled: Boolean(mechanicId),
    onEvent: (payload) => {
      const event = parseRescueInboxEvent(payload);
      if (event) {
        void queryClient.invalidateQueries({
          queryKey: rescueInboxKeys.all,
        });
        onNotice?.(event);
      }
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: rescueInboxKeys.all });
    },
  });
}

// Operations feed for the dispatcher rescue board: every rescue mutation
// publishes here, so the board refreshes with no reload.
export function useRescueOperations() {
  const queryClient = useQueryClient();
  useRealtimeTopic(OPERATIONS_TOPIC, {
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (!event || !event.kind.startsWith("rescue-")) return;
      void queryClient.invalidateQueries({ queryKey: rescueInboxKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: rescueInboxKeys.all });
    },
  });
}

export function useRescueAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      action,
    }: {
      requestId: string;
      action: MechanicRescueAction;
    }) => rescueActionRequest(requestId, action),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rescueInboxKeys.all });
    },
  });
}

export function useRescueExpire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => rescueExpireRequest(requestId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rescueInboxKeys.all });
    },
  });
}

// Collect payment on a completed rescue. The caller supplies a stable
// paymentId so a retried submit replays instead of double-charging.
export function useRecordRescuePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      input,
    }: {
      requestId: string;
      input: RescuePaymentInput;
    }) => recordRescuePaymentRequest(requestId, input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rescueInboxKeys.all });
    },
  });
}

export function useIssueRescuePaymentCode() {
  return useMutation({
    mutationFn: (requestId: string) => issueRescuePaymentCodeRequest(requestId),
  });
}

// Dispatcher detail dialog: live detail plus timeline for one rescue.
export function useDispatchRescueDetail(requestId: string | null) {
  return useQuery({
    queryKey: rescueInboxKeys.detail(requestId ?? ""),
    queryFn: () => fetchDispatchRescueDetail(requestId as string),
    enabled: Boolean(requestId),
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Dispatcher manual override: hand-assign, cancel, or force-expire.
// Optimistic version conflicts surface as 409 for the dialog to refetch.
export function useDispatchRescueAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      body,
    }: {
      requestId: string;
      body: DispatchRescueActionBody;
    }) => dispatchRescueActionRequest(requestId, body),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: rescueInboxKeys.all });
    },
  });
}

// Dispatcher board page per status tab. The page index and cursor chain
// live in useCursorRoutePage on the caller — this hook only fetches the
// page the URL asks for, so back/forward stays consistent.
export function useDispatchRescues(status: string, cursor: string | null) {
  return useQuery({
    queryKey: rescueInboxKeys.dispatch(status, cursor),
    queryFn: () => fetchDispatchRescues(status, cursor),
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: 30 * 1000,
  });
}

// Seconds left on a 30s offer, ticking every second. Hits zero once, so
// the card fires the expire call exactly once per offer.
export function useOfferCountdown(
  offerExpiresAt: string | null,
): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!offerExpiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [offerExpiresAt]);
  if (!offerExpiresAt) return null;
  return Math.max(
    0,
    Math.round((new Date(offerExpiresAt).getTime() - now) / 1000),
  );
}

export type { RescueDetail };
