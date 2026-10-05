// Single home for timezone rules. Instants (UTC) are the only thing
// stored or compared; IANA zones travel alongside user-facing times so
// rendering and calendar buckets follow the place the work happens,
// never the server's local timezone. Pure functions, unit-tested.

// Product home zone: the documented default wherever a zone is missing
// (legacy rows, exotic browsers). Explicit and overridable — not a
// silent server-local assumption.
export const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** True for real IANA zones ("Asia/Ho_Chi_Minh"), false for garbage. */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Valid zone or null (missing, blank, unknown). Never throws. */
export function normalizeTimeZone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return isValidTimeZone(trimmed) ? trimmed : null;
}

/** Wall-clock minutes since midnight of `date` in `timeZone` — e.g.
 * 07:30 in Asia/Ho_Chi_Minh is 450. Null when the zone is garbage or the
 * runtime cannot produce parts. Never throws. */
export function minutesOfDayInZone(
  date: Date,
  timeZone: string,
): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
}
