"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/toast/useToast";
import { subscribeCrossTabEvents } from "@/lib/cross-tab/cross-tab.bus";
import {
  type CrossTabEvent,
  crossTabNotice,
} from "@/lib/cross-tab/cross-tab.protocol";
import { bookingKeys } from "./booking";
import { cartKeys } from "./cart";
import { guestAccessKeys } from "./guest-access";
import { orderKeys } from "./orders";
import { rescueKeys } from "./rescue";
import { useBookingServiceSelection } from "./useBookingServiceSelection";

// Every query another tab's new job can make stale. Refetches are cheap and
// keyed, so over-invalidating is safer than leaving one surface behind.
const RECORD_CREATED_KEYS = [
  guestAccessKeys.recent,
  guestAccessKeys.records,
  cartKeys.all,
  orderKeys.all,
  bookingKeys.last,
  bookingKeys.mine,
  rescueKeys.mine,
] as const;

// Listens for jobs and cart edits made in OTHER tabs of this browser and
// brings this tab up to date: refetch the affected queries, drop booked
// services from this tab's selection so the same work cannot be booked
// twice, and say why the page just changed. Mounted once in the root layout.
export function useCrossTabSync(): void {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { removeServiceIds } = useBookingServiceSelection();

  // The subscription lives for the whole page; refs keep it reading the
  // latest callbacks without re-subscribing on every render.
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const removeRef = useRef(removeServiceIds);
  removeRef.current = removeServiceIds;

  useEffect(() => {
    function handle(event: CrossTabEvent) {
      if (event.kind === "cart-changed") {
        void queryClient.invalidateQueries({ queryKey: cartKeys.all });
        return;
      }
      for (const queryKey of RECORD_CREATED_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
      if (event.serviceIds.length > 0) removeRef.current(event.serviceIds);
      const notice = crossTabNotice(event);
      if (notice) toastRef.current.info(notice.title, notice.description);
    }
    return subscribeCrossTabEvents(handle);
  }, [queryClient]);
}
