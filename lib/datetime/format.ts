import { DEFAULT_TIME_ZONE } from "./timezone";

export type FormatDateTimeOptions = {
  locale?: string;
  timeZone?: string | null;
  withZoneSuffix?: boolean;
};

// One formatter for every user-facing timestamp: invalid input renders
// the fallback (never throws), the zone is always explicit, and the
// short offset suffix ("GMT+7") disambiguates across countries.
export function formatDateTime(
  value: string | Date | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  const fallback = "—";
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const { locale = "vi-VN", timeZone, withZoneSuffix = true } = options;
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone ?? DEFAULT_TIME_ZONE,
      ...(withZoneSuffix ? { timeZoneName: "short" as const } : {}),
    }).format(date);
  } catch {
    return fallback;
  }
}

/** Short date for history rows, same explicit-zone rule. */
export function formatShortDateTime(
  value: string | Date | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  const fallback = "—";
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const { locale = "vi-VN", timeZone } = options;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: timeZone ?? DEFAULT_TIME_ZONE,
    }).format(date);
  } catch {
    return fallback;
  }
}
