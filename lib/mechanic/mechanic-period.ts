// Calendar helpers for income and performance periods. Every function
// takes an explicit IANA zone (defaulting to the product home zone), so
// a booking completed at 23:30 in Ho Chi Minh City counts for that same
// day — and a future country renders its own days by passing its zone.
// Pure functions only: no Date library, no Intl timezone database lookups
// beyond formatToParts.

export const MECHANIC_TIME_ZONE = "Asia/Ho_Chi_Minh";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

function zonedParts(date: Date, timeZone: string): ZonedParts {
  let formatter = zoneFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (zoneFormatters.size >= 16) {
      zoneFormatters.delete(zoneFormatters.keys().next().value ?? "");
    }
    zoneFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(date);
  const read = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  // "24" appears for midnight in some ICU versions; normalize to 0.
  const hour = read("hour") % 24;
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(parts: ZonedParts): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function keyToUtcDay(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)).getUTCDay();
}

/** Calendar day key in the given zone, e.g. "2026-09-16". */
export function dayKey(
  date: Date,
  timeZone: string = MECHANIC_TIME_ZONE,
): string {
  return toDateKey(zonedParts(date, timeZone));
}

/** Month key in the given zone, e.g. "2026-09". */
export function monthKey(
  date: Date,
  timeZone: string = MECHANIC_TIME_ZONE,
): string {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}`;
}

/** Day key of the Monday of the week that contains `date`. */
export function weekKey(
  date: Date,
  timeZone: string = MECHANIC_TIME_ZONE,
): string {
  const key = dayKey(date, timeZone);
  const weekday = keyToUtcDay(key); // 0 = Sunday
  const offset = (weekday + 6) % 7; // Monday = 0
  if (offset === 0) return key;
  const [year, month, day] = key.split("-").map(Number);
  const monday = new Date(
    Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) - offset),
  );
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(
    monday.getUTCDate(),
  )}`;
}

export function isSameDay(
  date: Date,
  reference: Date,
  timeZone: string = MECHANIC_TIME_ZONE,
): boolean {
  return dayKey(date, timeZone) === dayKey(reference, timeZone);
}

export function isSameWeek(
  date: Date,
  reference: Date,
  timeZone: string = MECHANIC_TIME_ZONE,
): boolean {
  return weekKey(date, timeZone) === weekKey(reference, timeZone);
}

export function isSameMonth(
  date: Date,
  reference: Date,
  timeZone: string = MECHANIC_TIME_ZONE,
): boolean {
  return monthKey(date, timeZone) === monthKey(reference, timeZone);
}

// Month keys for the last `count` months ending at `reference`, oldest
// first, so a chart can render left-to-right without re-sorting.
export function recentMonthKeys(
  reference: Date,
  count: number,
  timeZone: string = MECHANIC_TIME_ZONE,
): string[] {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 1;
  const parts = zonedParts(reference, timeZone);
  const cursor = new Date(Date.UTC(parts.year, parts.month - 1, 1, 12, 0, 0));
  const keys: string[] = [];
  for (let index = 0; index < safeCount; index += 1) {
    keys.push(`${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}`);
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return keys.reverse();
}
