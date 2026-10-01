// Datetime-local helpers for the booking schedule input. Pure and
// unit-tested; the min/max mirror the service validation window.

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local `YYYY-MM-DDTHH:mm` for datetime-local inputs. */
export function toDatetimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Default slot: three days out at 9:00, safely past the 2-day lead. */
export function defaultScheduled(): string {
  const day = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  day.setHours(9, 0, 0, 0);
  return toDatetimeLocal(day);
}

/** Earliest pickable slot: now plus the 2-day dispatch lead time. */
export function minScheduled(): string {
  return toDatetimeLocal(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
}
