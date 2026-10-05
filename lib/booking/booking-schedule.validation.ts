import { minutesOfDayInZone } from "@/lib/datetime/timezone";
import type { OpenWindow } from "@/lib/shop/business-hours.types";
import { formatMinutesOfDay } from "@/lib/shop/business-hours.types";
import type { BookingFieldErrors } from "./booking.types";

// Scheduled-slot rules shared by the /booking form and POST
// /api/bookings. The slot is a customer wish — staff confirm the real
// time later — so the only bound is the admin-tuned intake window: a
// lead-time floor, an optional advance-booking cap, and the shop's
// daily working window. All reach this validator through options,
// keeping the function pure.
export const BOOKING_MIN_LEAD_DAYS = 2;

// Wall-clock strings ("2026-09-17T09:00") parse in the SERVER zone, so a
// UTC container would shift every booking by hours. Only instants with
// an explicit designator (Z or ±hh:mm) are accepted; the form always
// converts datetime-local through the browser zone before submitting.
const ISO_WITH_OFFSET_PATTERN =
  /T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})$/;

const DAY_MS = 24 * 60 * 60 * 1000;

function leadTimeError(minLeadDays: number): string {
  if (minLeadDays <= 0) {
    return "Vui lòng chọn khung giờ trong tương lai.";
  }
  return `Vui lòng đặt trước ít nhất ${minLeadDays} ngày để shop kịp liên hệ chốt lịch.`;
}

export type ScheduleWindowOptions = {
  minLeadDays?: number;
  maxAdvanceDays?: number;
  // Daily working window in the shop zone; null = any hour.
  openWindow?: OpenWindow | null;
};

export function normalizeScheduledAt(
  input: unknown,
  options: ScheduleWindowOptions,
  errors: BookingFieldErrors,
): Date | null {
  const minLeadDays = options.minLeadDays ?? BOOKING_MIN_LEAD_DAYS;
  // 0/absent keeps the previous no-upper-bound rule.
  const maxAdvanceDays = options.maxAdvanceDays ?? 0;
  const openWindow = options.openWindow ?? null;
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) {
    errors.scheduledAt = "Vui lòng chọn khung giờ.";
    return null;
  }
  if (!ISO_WITH_OFFSET_PATTERN.test(raw)) {
    errors.scheduledAt =
      "Khung giờ thiếu múi giờ. Vui lòng đặt lại từ trang đặt lịch.";
    return null;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    errors.scheduledAt = "Khung giờ không hợp lệ.";
    return null;
  }
  const now = Date.now();
  const earliest = now + minLeadDays * DAY_MS;
  const latest = now + maxAdvanceDays * DAY_MS;
  if (parsed.getTime() < earliest) {
    errors.scheduledAt = leadTimeError(minLeadDays);
    return null;
  }
  if (maxAdvanceDays > 0 && parsed.getTime() > latest) {
    errors.scheduledAt = `Vui lòng chọn khung giờ trong vòng ${maxAdvanceDays} ngày tới.`;
    return null;
  }
  if (openWindow) {
    const minutes = minutesOfDayInZone(parsed, openWindow.timeZone);
    if (
      minutes !== null &&
      (minutes < openWindow.opensAtMin || minutes >= openWindow.closesAtMin)
    ) {
      errors.scheduledAt = `Shop làm việc ${formatMinutesOfDay(openWindow.opensAtMin)}–${formatMinutesOfDay(openWindow.closesAtMin)}. Vui lòng chọn khung giờ trong giờ làm việc.`;
      return null;
    }
  }
  return parsed;
}
