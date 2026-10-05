// Datetime-local helpers for the booking schedule input. Pure and
// unit-tested; the bounds mirror the service intake window, which
// admins can retune — callers pass the live policy through.
import { BOOKING_MIN_LEAD_DAYS } from "@/lib/booking/booking.validation";

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local `YYYY-MM-DDTHH:mm` for datetime-local inputs. */
export function toDatetimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Default slot: one day past the lead floor at 9:00, clamped to the
 * advance cap when a tuned window would otherwise sit outside it.
 */
export function defaultScheduled(
  leadDays: number = BOOKING_MIN_LEAD_DAYS,
  maxDays = 0,
): string {
  const offset = maxDays > 0 ? Math.min(leadDays + 1, maxDays) : leadDays + 1;
  const day = new Date(Date.now() + offset * DAY_MS);
  day.setHours(9, 0, 0, 0);
  return toDatetimeLocal(day);
}

/** Earliest pickable slot: now plus the configured lead time. */
export function minScheduled(leadDays: number = BOOKING_MIN_LEAD_DAYS): string {
  return toDatetimeLocal(new Date(Date.now() + leadDays * DAY_MS));
}

/** Latest pickable slot: empty string when the cap is off (0). */
export function maxScheduled(maxDays = 0): string {
  if (maxDays <= 0) return "";
  return toDatetimeLocal(new Date(Date.now() + maxDays * DAY_MS));
}
