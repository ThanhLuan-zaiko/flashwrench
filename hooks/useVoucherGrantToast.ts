"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/toast/useToast";
import { parseDomainEvent } from "@/lib/realtime/protocol";
import { subscribeRealtimeTopic } from "@/lib/realtime/realtime-client";

// Toast on every auto/manual grant for the signed-in owner. The realtime
// payload carries only ids, so the toast stays generic and the /vouchers
// query invalidation pulls the fresh wallet for the real content.
export function useVoucherGrantToast(ownerId?: string | null): void {
  const queryClient = useQueryClient();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!ownerId) return;
    const topic = `user:${ownerId}`;
    return subscribeRealtimeTopic(topic, (payload) => {
      const event = parseDomainEvent(payload);
      if (event?.kind !== "voucher-granted") return;
      void queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toastRef.current.success(
        "Bạn nhận được khuyến mãi mới",
        "Mở ví voucher để xem phiếu vừa về.",
      );
    });
  }, [ownerId, queryClient]);
}
