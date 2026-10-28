"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publishCrossTabEvent } from "@/lib/cross-tab/cross-tab.bus";
import { recordCreatedEvent } from "@/lib/cross-tab/cross-tab.protocol";
import type { CheckoutInput } from "@/lib/orders/orders.types";
import {
  orderTopic,
  parseDomainEvent,
  userTopic,
} from "@/lib/realtime/protocol";
import {
  cancelOrderRequest,
  checkoutRequest,
  fetchMyOrder,
  fetchMyOrders,
  fetchMyOrderTrack,
  payOrderOnlineRequest,
  requestOrderReturnRequest,
} from "@/services/orders.api";
import { useMe } from "./auth";
import { cartKeys } from "./cart";
import { guestAccessKeys } from "./guest-access";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const orderKeys = {
  all: ["orders"] as const,
  detail: (orderId: string) => ["orders", orderId] as const,
  track: (orderId: string) => ["orders", orderId, "track"] as const,
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

// Live courier position + breadcrumb trail for a shipping order.
// Poll kept as fallback; the public order topic gives instant refresh.
export function useMyOrderTrack(orderId: string | null) {
  const me = useMe();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: orderKeys.track(orderId ?? ""),
    queryFn: () => fetchMyOrderTrack(orderId as string),
    enabled: me.data?.role === "customer" && Boolean(orderId),
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: 15 * 1000,
  });
  useRealtimeTopic(orderId ? orderTopic(orderId) : "", {
    enabled: Boolean(orderId) && me.data?.role === "customer",
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (event?.kind !== "order-updated") return;
      if (event.orderId && event.orderId !== orderId) return;
      void queryClient.invalidateQueries({
        queryKey: orderKeys.track(orderId as string),
      });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId as string),
      });
    },
    onReconnect: () => {
      if (!orderId) return;
      void queryClient.invalidateQueries({
        queryKey: orderKeys.track(orderId),
      });
    },
  });
  return query;
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
      const event = parseDomainEvent(payload);
      if (event?.kind !== "order-updated") return;
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
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
    // Other tabs refetch their cart too, so a stale checkout page there
    // cannot submit the cart this order just consumed.
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: cartKeys.all });
      void queryClient.invalidateQueries({ queryKey: guestAccessKeys.recent });
      publishCrossTabEvent(recordCreatedEvent("order", data.order.id));
    },
  });
}

// Simulated online payment from the order detail page.
export function usePayOrderOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => payOrderOnlineRequest(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
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

// Customer files a return/refund request with evidence photos.
export function useRequestOrderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      orderId: string;
      reason: string;
      images: string[];
    }) => requestOrderReturnRequest(input.orderId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
