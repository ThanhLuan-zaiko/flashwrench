"use client";

import { useQuery } from "@tanstack/react-query";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { OPERATIONS_TOPIC } from "@/lib/realtime/protocol";
import type { RevenueQuery } from "@/services/revenue.api";
import {
  fetchAdminRevenue,
  fetchDispatchRevenue,
  fetchPaymentAudit,
} from "@/services/revenue.api";

export const revenueKeys = {
  all: ["revenue"] as const,
  dispatch: (query: RevenueQuery) => ["revenue", "dispatch", query] as const,
  admin: (query: RevenueQuery) => ["revenue", "admin", query] as const,
  audit: (query: RevenueQuery) => ["revenue", "audit", query] as const,
};

// Collections publish on the operations feed, so revenue screens refresh
// live — the same event source that drives the dispatch board.
export function useRevenueRealtime() {
  useDomainRealtime(OPERATIONS_TOPIC, [revenueKeys.all]);
}

export function useDispatchRevenue(query: RevenueQuery) {
  return useQuery({
    queryKey: revenueKeys.dispatch(query),
    queryFn: () => fetchDispatchRevenue(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminRevenue(query: RevenueQuery) {
  return useQuery({
    queryKey: revenueKeys.admin(query),
    queryFn: () => fetchAdminRevenue(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function usePaymentAudit(query: RevenueQuery) {
  return useQuery({
    queryKey: revenueKeys.audit(query),
    queryFn: () => fetchPaymentAudit(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
