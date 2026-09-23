"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OPERATIONS_TOPIC, parseDomainEvent } from "@/lib/realtime/protocol";
import type {
  CounterSalePayload,
  CourierConfigInput,
  DispatchOrdersQuery,
} from "@/services/dispatch-orders.api";
import {
  createCounterSaleRequest,
  fetchDispatchOrder,
  fetchDispatchOrders,
  fetchDispatchParts,
  setPartStockRequest,
  updateDispatchOrderStatus,
} from "@/services/dispatch-orders.api";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const dispatchOrderKeys = {
  all: ["dispatch-orders"] as const,
  list: (query: DispatchOrdersQuery) =>
    ["dispatch-orders", "list", query] as const,
  detail: (orderId: string) =>
    ["dispatch-orders", "detail", { orderId }] as const,
  stock: ["dispatch-stock"] as const,
};

// The order board is a live console: short stale time plus a 60s safety
// poll, while the operations topic pushes instant refreshes.
export function useDispatchOrders(query: DispatchOrdersQuery) {
  return useQuery({
    queryKey: dispatchOrderKeys.list(query),
    queryFn: () => fetchDispatchOrders(query),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useDispatchOrder(orderId: string | null) {
  return useQuery({
    queryKey: dispatchOrderKeys.detail(orderId ?? ""),
    queryFn: () => fetchDispatchOrder(orderId as string),
    enabled: Boolean(orderId),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useDispatchParts() {
  return useQuery({
    queryKey: dispatchOrderKeys.stock,
    queryFn: () => fetchDispatchParts(),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Order events ride the shared operations topic; any orders-updated event
// refreshes the board and the open detail.
export function useDispatchOrdersRealtime(enabled = true) {
  const queryClient = useQueryClient();
  useRealtimeTopic(OPERATIONS_TOPIC, {
    enabled,
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (event?.kind === "orders-updated") {
        void queryClient.invalidateQueries({
          queryKey: dispatchOrderKeys.all,
        });
      }
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.all });
    },
  });
}

export function useUpdateDispatchOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      status,
      note,
      courier,
    }: {
      orderId: string;
      status: string;
      note?: string;
      courier?: CourierConfigInput;
    }) => updateDispatchOrderStatus(orderId, status, note, courier),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.all });
    },
  });
}

export function useCreateCounterSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CounterSalePayload) =>
      createCounterSaleRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.all });
      void queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.stock,
      });
    },
  });
}

export function useSetPartStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partId, stockQty }: { partId: string; stockQty: number }) =>
      setPartStockRequest(partId, stockQty),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.stock,
      });
    },
  });
}
