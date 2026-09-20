"use client";

import { useEffect, useRef } from "react";
import { subscribeRealtimeTopic } from "@/lib/realtime/realtime-client";

type UseRealtimeTopicOptions = {
  enabled?: boolean;
  onEvent?: (payload: unknown) => void;
  onReconnect?: () => void;
};

// Generic realtime subscription for any gateway topic. The underlying
// socket is shared page-wide; EventSource-style auto reconnect included.
export function useRealtimeTopic(
  topic: string,
  options?: UseRealtimeTopicOptions,
) {
  const enabled = options?.enabled ?? true;
  const handler = useRef(options?.onEvent);
  handler.current = options?.onEvent;
  const reconnectHandler = useRef(options?.onReconnect);
  reconnectHandler.current = options?.onReconnect;

  useEffect(() => {
    if (!enabled || topic.length === 0) return;
    return subscribeRealtimeTopic(
      topic,
      (payload) => {
        handler.current?.(payload);
      },
      () => {
        reconnectHandler.current?.();
      },
    );
  }, [topic, enabled]);
}
