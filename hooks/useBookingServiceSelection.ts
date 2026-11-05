"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createBookingSelectionStore } from "@/lib/booking/booking-selection-store";
import { BOOKING_QUEUE_KEY } from "@/lib/booking/booking-service-queue";
import { decodeBookingServiceIds } from "@/lib/booking/booking-service-selection";

const tabStorage = () =>
  typeof window === "undefined" ? null : window.sessionStorage;
const selectionStore = createBookingSelectionStore(tabStorage);
const queueStore = createBookingSelectionStore(tabStorage, BOOKING_QUEUE_KEY);

function useServiceIdStore(store: typeof selectionStore) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const serviceIds = useMemo(
    () => decodeBookingServiceIds(snapshot),
    [snapshot],
  );
  return {
    serviceIds,
    setServiceIds: store.setServiceIds,
    toggleService: store.toggleService,
    removeServiceIds: store.removeServiceIds,
  };
}

export function useBookingServiceSelection() {
  return useServiceIdStore(selectionStore);
}

// Services waiting for their own appointment after the current one.
export function useBookingServiceQueue() {
  return useServiceIdStore(queueStore);
}
