"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CheckoutInput } from "@/lib/orders/orders.types";
import { userTopic } from "@/lib/realtime/protocol";
import {
  cancelOrderRequest,
  checkoutRequest,
  fetchMyOrder,
  fetchMyOrders,
} from "@/services/orders.api";
import { useMe } from "./auth";
import { cartKeys } from "./cart";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const orderKeys = {
  all: ["orders"] as const,
  detail: (orderId: string) => ["orders", orderId] as const,
};

export function useMyOrders() {
  const me = useMe();
  return useQuery({
    queryKey: orderKeys.all,
    queryFn: () => fetchMyOrders(),
    enabled: me.data?.role === "customer",
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useMyOrder(orderId: string | null) {
  const me = useMe();
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? ""),
    queryFn: () => fetchMyOrder(orderId as string),
    enabled: me.data?.role === "customer" && Boolean(orderId),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Order status events arrive on the customer's own user topic; refresh
// both the list and whichever detail page is open.
export function useMyOrdersRealtime(enabled = true) {
  const me = useMe();
  const queryClient = useQueryClient();
  const userId = me.data?.id ?? "";
  useRealtimeTopic(userId ? userTopic(userId) : "", {
    enabled: enabled && Boolean(userId),
    onEvent: (payload) => {
      if (
        typeof payload === "object" &&
        payload !== null &&
        (payload as { kind?: unknown }).kind === "order-updated"
      ) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      }
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckoutInput) => checkoutRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrderRequest(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
