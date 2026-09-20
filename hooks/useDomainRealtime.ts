"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { useRealtimeTopic } from "@/hooks/useRealtimeTopic";
import { parseDomainEvent } from "@/lib/realtime/protocol";

export function useDomainRealtime(
  topic: string,
  queryKeys: readonly (readonly unknown[])[],
  enabled = true,
): void {
  const queryClient = useQueryClient();
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  const invalidate = useCallback(() => {
    for (const key of keysRef.current) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  useRealtimeTopic(topic, {
    enabled,
    onEvent: (payload) => {
      if (!parseDomainEvent(payload)) return;
      invalidate();
    },
    onReconnect: invalidate,
  });
}
