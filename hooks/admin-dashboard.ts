"use client";

import { useQuery } from "@tanstack/react-query";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { OPERATIONS_TOPIC } from "@/lib/realtime/protocol";
import { fetchAdminDashboard } from "@/services/admin.api";

export const adminDashboardKeys = {
  all: ["admin-dashboard"] as const,
};

// Payment collections and booking/rescue changes publish on the
// operations feed — the dashboard refreshes itself on every event.
export function useAdminDashboardRealtime() {
  useDomainRealtime(OPERATIONS_TOPIC, [adminDashboardKeys.all]);
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: fetchAdminDashboard,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
}
