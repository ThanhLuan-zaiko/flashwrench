"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PARTS_CATALOG_TOPIC } from "@/lib/realtime/protocol";
import { fetchPublicPart, fetchPublicParts } from "@/services/products.api";
import { useRealtimeTopic } from "./useRealtimeTopic";

export const productsKeys = {
  all: ["public-parts"] as const,
  detail: (slug: string) => ["public-parts", "detail", slug] as const,
};

// Public shop catalog for /products: cached briefly, refetched on window
// focus so stock/price edits appear even when the gateway is down.
export function usePublicParts() {
  return useQuery({
    queryKey: productsKeys.all,
    queryFn: () => fetchPublicParts(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

export function usePublicPart(slug: string) {
  return useQuery({
    queryKey: productsKeys.detail(slug),
    queryFn: () => fetchPublicPart(slug),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Invalidate the shop catalog whenever the admin publishes a change or
// staff adjusts stock. Events carry only a refresh signal.
export function usePartsCatalogRealtime(enabled = true) {
  const queryClient = useQueryClient();
  useRealtimeTopic(PARTS_CATALOG_TOPIC, {
    enabled,
    onEvent: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}
