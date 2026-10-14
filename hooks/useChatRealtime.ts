"use client";

import { useQueryClient } from "@tanstack/react-query";
import { parseDomainEvent, userTopic } from "@/lib/realtime/protocol";
import { chatKeys } from "./chat";
import { useRealtimeTopic } from "./useRealtimeTopic";

// Live refresh for the chat surface: both ends receive events on their
// private `user:{id}` topic; invalidation refetches the full payloads
// through the authenticated API so nothing sensitive rides the wire.
// Uses the shared topic hook so reconnects resubscribe and catch up.
export function useChatRealtime(userId: string | null): void {
  const queryClient = useQueryClient();
  const invalidateThread = (threadId: string) => {
    void queryClient.invalidateQueries({
      queryKey: chatKeys.messages(threadId),
    });
    void queryClient.invalidateQueries({
      queryKey: chatKeys.thread(threadId),
    });
    void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    void queryClient.invalidateQueries({
      queryKey: chatKeys.bookings(threadId),
    });
  };
  useRealtimeTopic(userId ? userTopic(userId) : "", {
    enabled: Boolean(userId),
    onEvent: (payload) => {
      const event = parseDomainEvent(payload);
      if (!event?.threadId) return;
      if (event.kind === "chat-message" || event.kind === "chat-read") {
        invalidateThread(event.threadId);
      }
    },
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
  });
}
