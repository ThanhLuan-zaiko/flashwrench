"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/toast/useToast";
import type { PaymentPromptItem } from "@/lib/payments/payment-prompt.types";
import { parseDomainEvent, userTopic } from "@/lib/realtime/protocol";
import { fetchPaymentPrompts } from "@/services/payment-prompts.api";
import { useMe } from "./auth";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const paymentPromptKeys = {
  all: ["payment-prompts"] as const,
};

// Any event that can create or kill a prompt: a collector issuing the code
// bumps the ref row, a recorded payment settles it.
const PROMPT_EVENTS = new Set([
  "booking-updated",
  "rescue-updated",
  "order-updated",
  "payment-recorded",
]);

export function usePaymentPrompts() {
  const me = useMe();
  return useQuery({
    queryKey: paymentPromptKeys.all,
    queryFn: () => fetchPaymentPrompts().then((data) => data.prompts),
    enabled: me.data?.role === "customer",
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// The customer may be anywhere on the site when the mechanic issues a code,
// so the subscription lives on their user topic and just re-pulls the list.
// Newly appeared refs fire one toast each — deduped by ref id so a refetch
// never nags twice about the same order.
export function usePaymentPromptsRealtime(
  prompts: PaymentPromptItem[] | undefined,
): void {
  const me = useMe();
  const userId = me.data?.id ?? "";
  const queryClient = useQueryClient();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!prompts) return;
    const seen = seenRef.current;
    if (seen === null) {
      // First load: prompts that already existed are not news.
      seenRef.current = new Set(prompts.map(promptKey));
      return;
    }
    for (const prompt of prompts) {
      const key = promptKey(prompt);
      if (seen.has(key)) continue;
      seen.add(key);
      toastRef.current.info(
        "Có khoản cần thanh toán",
        `${prompt.title} — đọc mã xác nhận cho thợ.`,
      );
    }
  }, [prompts]);

  useRealtimeTopic(userId ? userTopic(userId) : "", {
    enabled: Boolean(userId),
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (!event || !PROMPT_EVENTS.has(event.kind)) return;
      void queryClient.invalidateQueries({ queryKey: paymentPromptKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: paymentPromptKeys.all });
    },
  });
}

function promptKey(prompt: PaymentPromptItem): string {
  return `${prompt.kind}:${prompt.refId}`;
}
