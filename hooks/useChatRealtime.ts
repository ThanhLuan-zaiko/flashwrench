"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { parseDomainEvent } from "@/lib/realtime/protocol";
import { subscribeRealtimeTopic } from "@/lib/realtime/realtime-client";
import { chatKeys } from "./chat";

// Live refresh for the chat surface: both ends receive events on their
// private `user:{id}` topic; invalidation refetches the full payloads
// through the authenticated API so nothing sensitive rides the wire.
export function useChatRealtime(userId: string | null): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const cleanup = subscribeRealtimeTopic(`user:${userId}`, (payload) => {
      const event = parseDomainEvent(payload);
      if (!event?.threadId) return;
      if (event.kind === "chat-message" || event.kind === "chat-read") {
        void queryClient.invalidateQueries({
          queryKey: chatKeys.messages(event.threadId),
        });
        void queryClient.invalidateQueries({
          queryKey: chatKeys.thread(event.threadId),
        });
        void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      }
    });
    return cleanup;
  }, [userId, queryClient]);
}
