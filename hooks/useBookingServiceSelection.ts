"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createBookingSelectionStore } from "@/lib/booking/booking-selection-store";
import { decodeBookingServiceIds } from "@/lib/booking/booking-service-selection";

const selectionStore = createBookingSelectionStore(() =>
  typeof window === "undefined" ? null : window.sessionStorage,
);

export function useBookingServiceSelection() {
  const snapshot = useSyncExternalStore(
    selectionStore.subscribe,
    selectionStore.getSnapshot,
    selectionStore.getServerSnapshot,
  );
  const serviceIds = useMemo(
    () => decodeBookingServiceIds(snapshot),
    [snapshot],
  );
  return {
    serviceIds,
    setServiceIds: selectionStore.setServiceIds,
    toggleService: selectionStore.toggleService,
    removeServiceIds: selectionStore.removeServiceIds,
  };
}
