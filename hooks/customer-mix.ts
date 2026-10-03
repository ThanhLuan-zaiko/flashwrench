"use client";

import { useQuery } from "@tanstack/react-query";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { OPERATIONS_TOPIC } from "@/lib/realtime/protocol";
import type { CustomerMixQuery } from "@/services/customer-mix.api";
import {
  fetchAdminCustomerMix,
  fetchDispatchCustomerMix,
} from "@/services/customer-mix.api";

export const customerMixKeys = {
  all: ["customer-mix"] as const,
  dispatch: (query: CustomerMixQuery) =>
    ["customer-mix", "dispatch", query] as const,
  admin: (query: CustomerMixQuery) => ["customer-mix", "admin", query] as const,
};

// New bookings, orders and rescues publish on the operations feed — the
// same event source that drives revenue, so the mix boards refresh live.
export function useCustomerMixRealtime() {
  useDomainRealtime(OPERATIONS_TOPIC, [customerMixKeys.all]);
}

export function useDispatchCustomerMix(query: CustomerMixQuery) {
  return useQuery({
    queryKey: customerMixKeys.dispatch(query),
    queryFn: () => fetchDispatchCustomerMix(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminCustomerMix(query: CustomerMixQuery) {
  return useQuery({
    queryKey: customerMixKeys.admin(query),
    queryFn: () => fetchAdminCustomerMix(query),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
