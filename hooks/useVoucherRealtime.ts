"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { parseDomainEvent } from "@/lib/realtime/protocol";
import { subscribeRealtimeTopic } from "@/lib/realtime/realtime-client";
import { PROMOTIONS_TOPIC } from "@/lib/vouchers/voucher-realtime-topics";

// Live refresh for voucher screens: public campaign feed plus the
// private owner inbox (user:{id}) and the staff operations board.
export function useVoucherRealtime(ownerId?: string, isStaff = false): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidateAll = () => {
      void queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    };
    const topics = [PROMOTIONS_TOPIC];
    if (ownerId) topics.push(`user:${ownerId}`);
    if (isStaff) topics.push("operations");
    const cleanups = topics.map((topic) =>
      subscribeRealtimeTopic(topic, (payload) => {
        const event = parseDomainEvent(payload);
        if (!event) return;
        if (
          event.kind === "promotion-updated" ||
          event.kind === "voucher-granted" ||
          event.kind === "voucher-used" ||
          event.kind === "voucher-revoked"
        ) {
          invalidateAll();
        }
      }),
    );
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [ownerId, isStaff, queryClient]);
}
