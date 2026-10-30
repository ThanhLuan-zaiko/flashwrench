"use client";

import { useQuery } from "@tanstack/react-query";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { OPERATIONS_TOPIC } from "@/lib/realtime/protocol";
import { fetchDispatchPulse } from "@/services/dispatch.api";

export const dispatchPulseKeys = {
  all: ["dispatch-pulse"] as const,
};

// Booking and rescue changes publish on the operations feed; the pulse
// refetches and its canvases morph to the new counts. The minute poll
// keeps the "current hour" moving on a quiet board.
export function useDispatchPulse() {
  useDomainRealtime(OPERATIONS_TOPIC, [dispatchPulseKeys.all]);
  return useQuery({
    queryKey: dispatchPulseKeys.all,
    queryFn: fetchDispatchPulse,
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: false,
  });
}
