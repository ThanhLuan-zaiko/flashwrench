"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useBookingConfigRealtime,
  usePublicBookingConfig,
} from "@/hooks/booking-config";
import {
  useBusinessHoursRealtime,
  usePublicBusinessHours,
} from "@/hooks/shop-settings";
import { BOOKING_MIN_LEAD_DAYS } from "@/lib/booking/booking.validation";
import {
  formatMinutesOfDay,
  openWindowOf,
} from "@/lib/shop/business-hours.types";
import {
  defaultScheduled,
  maxScheduled,
  minScheduled,
} from "./booking-datetime";

// Live intake window for the schedule input: the admin-tuned floor/cap
// ride the public booking-config topic, so a retune lands in open forms
// without a refresh. An untouched slot tracks the window; a picked or
// restored one stays put so config changes never steal the user's choice.
export function useScheduleWindow() {
  const bookingConfig = usePublicBookingConfig();
  const businessHours = usePublicBusinessHours();
  useBookingConfigRealtime(true);
  useBusinessHoursRealtime(true);
  const leadDays = bookingConfig.data?.minLeadDays ?? BOOKING_MIN_LEAD_DAYS;
  const maxDays = bookingConfig.data?.maxAdvanceDays ?? 0;
  const openWindow = useMemo(
    () => (businessHours.data ? openWindowOf(businessHours.data) : null),
    [businessHours.data],
  );
  // e.g. "07:00–20:00" for the schedule hint; null when unrestricted.
  const hoursLabel = useMemo(
    () =>
      openWindow
        ? `${formatMinutesOfDay(openWindow.opensAtMin)}–${formatMinutesOfDay(openWindow.closesAtMin)}`
        : null,
    [openWindow],
  );
  const [touched, setTouched] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(defaultScheduled);
  const minSlot = useMemo(() => minScheduled(leadDays), [leadDays]);
  const maxSlot = useMemo(() => maxScheduled(maxDays), [maxDays]);

  useEffect(() => {
    if (!touched) setScheduledAt(defaultScheduled(leadDays, maxDays));
  }, [leadDays, maxDays, touched]);

  function pick(value: string) {
    setTouched(true);
    setScheduledAt(value);
  }

  // datetime-local strings compare lexicographically; a stale slot
  // outside the tuned window keeps the fresh default.
  function restore(value: string) {
    if (
      value !== "" &&
      value >= minSlot &&
      (maxSlot === "" || value <= maxSlot)
    ) {
      pick(value);
    }
  }

  function reset() {
    setTouched(false);
    setScheduledAt(defaultScheduled(leadDays, maxDays));
  }

  return {
    scheduledAt,
    minSlot,
    maxSlot,
    leadDays,
    maxDays,
    openWindow,
    hoursLabel,
    pick,
    restore,
    reset,
  };
}
