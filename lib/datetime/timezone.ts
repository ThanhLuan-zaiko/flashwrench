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
