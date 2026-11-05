"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import {
  useBookingServiceQueue,
  useBookingServiceSelection,
} from "@/hooks/useBookingServiceSelection";
import {
  describeBookingConflict,
  nextBookingGroup,
} from "@/lib/booking/booking-service-queue";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// The catalog's booking plan: the current appointment, the services queued
// for later ones, and the conflict prompt shown when a picked service cannot
// join the current appointment.
export function useServiceBookingPlan(
  services: readonly ServiceItem[],
  ready: boolean,
) {
  const toast = useToast();
  const draft = useBookingServiceSelection();
  const queue = useBookingServiceQueue();
  const [conflictId, setConflictId] = useState<string | null>(null);
  const selection = useMemo(
    () => getBookingServiceSelection(draft.serviceIds, services),
    [draft.serviceIds, services],
  );
  const queuedServices = useMemo(
    () =>
      queue.serviceIds.flatMap((id) => {
        const service = services.find((item) => item.id === id);
        return service ? [service] : [];
      }),
    [queue.serviceIds, services],
  );

  // With no current appointment left, the queue's next group takes its place
  // so a queued service never waits behind an empty selection.
  const { serviceIds: selectedIds, setServiceIds: select } = draft;
  const { serviceIds: queuedIds, setServiceIds: setQueue } = queue;
  useEffect(() => {
    if (!ready || selectedIds.length > 0 || queuedIds.length === 0) return;
    const group = nextBookingGroup(queuedIds, services);
    select(group);
    const known = new Set(services.map((service) => service.id));
    setQueue(queuedIds.filter((id) => known.has(id) && !group.includes(id)));
  }, [ready, selectedIds, queuedIds, services, select, setQueue]);

  const isPicked = (id: string) =>
    draft.serviceIds.includes(id) || queue.serviceIds.includes(id);
  // Removing an unavailable service comes first, so adding stays locked.
  const reasonFor = (service: ServiceItem) =>
    isPicked(service.id) || selection.unavailableIds.length === 0
      ? null
      : selection.issue;
  const issueFor = (id: string) =>
    getBookingServiceSelection([...draft.serviceIds, id], services).issue;
  const separateFor = (service: ServiceItem) =>
    !isPicked(service.id) &&
    selection.unavailableIds.length === 0 &&
    issueFor(service.id) !== null;

  const conflictService = services.find((item) => item.id === conflictId);
  // A conflict that resolved itself (say, from another tab) stops prompting.
  const conflict =
    conflictService && separateFor(conflictService)
      ? {
          service: conflictService,
          selected: selection.services,
          message: describeBookingConflict(
            conflictService,
            selection.services,
            issueFor(conflictService.id),
          ),
        }
      : null;

  return {
    serviceIds: draft.serviceIds,
    queuedIds: queue.serviceIds,
    selection,
    queuedServices,
    conflict,
    reasonFor,
    separateFor,
    toggle(service: ServiceItem) {
      if (queue.serviceIds.includes(service.id)) {
        queue.toggleService(service.id);
      } else if (separateFor(service)) {
        setConflictId(service.id);
      } else {
        draft.toggleService(service.id);
      }
    },
    remove: draft.toggleService,
    removeQueued: queue.toggleService,
    clear() {
      queue.setServiceIds([]);
      draft.setServiceIds([]);
    },
    queueConflict() {
      if (conflictId && !queue.toggleService(conflictId)) {
        toast.error(
          "Không thêm được dịch vụ",
          "Danh sách đặt tiếp đã đủ số dịch vụ tối đa.",
        );
      }
      setConflictId(null);
    },
    switchToConflict() {
      if (conflictId) draft.setServiceIds([conflictId]);
      setConflictId(null);
    },
    dismissConflict: () => setConflictId(null),
  };
}
