"use client";

import { useQuery } from "@tanstack/react-query";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { OPERATIONS_TOPIC } from "@/lib/realtime/protocol";
import { fetchZoneLoad } from "@/services/admin-rescue.api";
import { fetchOrderTrend } from "@/services/dispatch-orders.api";

export const pageChartKeys = {
  orderTrend: ["page-charts", "order-trend"] as const,
  zoneLoad: ["page-charts", "zone-load"] as const,
};

// Order and rescue changes publish on the operations feed, so both chart
// queries refetch live and their canvases morph to the new numbers.
export function useOrderTrend() {
  useDomainRealtime(OPERATIONS_TOPIC, [pageChartKeys.orderTrend]);
  return useQuery({
    queryKey: pageChartKeys.orderTrend,
    queryFn: fetchOrderTrend,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useZoneLoad() {
  useDomainRealtime(OPERATIONS_TOPIC, [pageChartKeys.zoneLoad]);
  return useQuery({
    queryKey: pageChartKeys.zoneLoad,
    queryFn: fetchZoneLoad,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
