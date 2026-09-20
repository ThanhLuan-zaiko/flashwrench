"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVICE_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { fetchPublicCatalog } from "@/services/public-catalog.api";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const publicCatalogKeys = {
  all: ["public-catalog"] as const,
};

// Public catalog for /services: cached briefly, refetched on window focus
// so price edits appear even when the gateway is down. Realtime is the
// fast path, HTTPS refetch is the reliable fallback.
export function usePublicCatalog() {
  return useQuery({
    queryKey: publicCatalogKeys.all,
    queryFn: () => fetchPublicCatalog(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

// Invalidate the public catalog whenever the admin publishes a change.
// Events carry only a refresh signal; the rows refetch over HTTPS.
export function useServiceCatalogRealtime(enabled = true) {
  const queryClient = useQueryClient();
  useRealtimeTopic(SERVICE_CATALOG_TOPIC, {
    enabled,
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: publicCatalogKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: publicCatalogKeys.all });
    },
  });
}
