// Datetime-local helpers for the booking schedule input. Pure and
// unit-tested; the min/max mirror the service validation window.

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local `YYYY-MM-DDTHH:mm` for datetime-local inputs. */
export function toDatetimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Default slot: tomorrow at 9:00, safely past the 1-hour lead time. */
export function defaultScheduled(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(9, 0, 0, 0);
  return toDatetimeLocal(tomorrow);
}

/** Earliest pickable slot: now plus the 1-hour dispatch lead time. */
export function minScheduled(): string {
  return toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000));
}

/** Latest pickable slot: 30 days ahead, matching the service window. */
export function maxScheduled(): string {
  return toDatetimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
}
