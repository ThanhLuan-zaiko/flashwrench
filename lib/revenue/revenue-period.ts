// Calendar math for revenue ranges. Reports always resolve to a list of
// day bucket keys (the payments_by_period partition key) plus ordered
// series bucket labels for the chart. Pure functions: no DB, no Intl
// beyond the formatter cache in mechanic-period.
import {
  dayKey,
  hourKey,
  MECHANIC_TIME_ZONE,
  monthKey,
} from "@/lib/mechanic/mechanic-period";

export const REVENUE_TIME_ZONE = MECHANIC_TIME_ZONE;

export const REVENUE_RANGES = ["day", "week", "month", "year"] as const;
export type RevenueRange = (typeof REVENUE_RANGES)[number];

export function isRevenueRange(value: unknown): value is RevenueRange {
  return (
    typeof value === "string" &&
    (REVENUE_RANGES as readonly string[]).includes(value)
  );
}

const DAY_KEY = /^(19|20|21)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH_KEY = /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/;
const YEAR_KEY = /^(19|20|21)\d{2}$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function keyToUtcDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

function utcDateToKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monday day-key of the week containing the given day key. */
function mondayOfWeek(key: string): string {
  const weekday = keyToUtcDate(key).getUTCDay(); // 0 = Sunday
  const offset = (weekday + 6) % 7;
  const date = keyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() - offset);
  return utcDateToKey(date);
}

/**
 * Normalize the caller-supplied anchor into the canonical key per range:
 * day/week -> 'YYYY-MM-DD' (week anchors snap to their Monday),
 * month -> 'YYYY-MM', year -> 'YYYY'. Missing anchor = the range that
 * contains `now`. Returns null on malformed input.
 */
export function normalizeRevenueAnchor(
  range: RevenueRange,
  raw: unknown,
  now: Date,
  timeZone: string = REVENUE_TIME_ZONE,
): string | null {
  const fallback = dayKey(now, timeZone);
  switch (range) {
    case "day":
      if (raw === undefined || raw === null || raw === "") return fallback;
      return typeof raw === "string" && DAY_KEY.test(raw) ? raw : null;
    case "week": {
      if (raw === undefined || raw === null || raw === "") {
        return mondayOfWeek(fallback);
      }
      return typeof raw === "string" && DAY_KEY.test(raw)
        ? mondayOfWeek(raw)
        : null;
    }
    case "month": {
      if (raw === undefined || raw === null || raw === "") {
        return monthKey(now, timeZone);
      }
      if (typeof raw !== "string") return null;
      // The toolbar always sends a full day key; snap it to its month.
      if (DAY_KEY.test(raw)) return raw.slice(0, 7);
      return MONTH_KEY.test(raw) ? raw : null;
    }
    case "year": {
      if (raw === undefined || raw === null || raw === "") {
        return fallback.slice(0, 4);
      }
      if (typeof raw !== "string") return null;
      if (YEAR_KEY.test(raw)) return raw;
      if (DAY_KEY.test(raw) || MONTH_KEY.test(raw)) return raw.slice(0, 4);
      return null;
    }
  }
}

/** Every payments_by_period partition key covered by the range. */
export function rangeDayKeys(range: RevenueRange, anchor: string): string[] {
  switch (range) {
    case "day":
      return [anchor];
    case "week": {
      const monday = keyToUtcDate(anchor);
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday.getTime());
        date.setUTCDate(monday.getUTCDate() + index);
        return utcDateToKey(date);
      });
    }
    case "month": {
      const [year, month] = anchor.split("-").map(Number);
      const days = daysInMonth(year ?? 1970, month ?? 1);
      return Array.from(
        { length: days },
        (_, index) => `${anchor}-${pad(index + 1)}`,
      );
    }
    case "year": {
      const keys: string[] = [];
      for (let month = 1; month <= 12; month += 1) {
        const prefix = `${anchor}-${pad(month)}`;
        const days = daysInMonth(Number(anchor), month);
        for (let day = 1; day <= days; day += 1) {
          keys.push(`${prefix}-${pad(day)}`);
        }
      }
      return keys;
    }
  }
}

/** Day keys of the immediately preceding equivalent range (for deltas). */
export function previousRangeDayKeys(
  range: RevenueRange,
  anchor: string,
): string[] {
  switch (range) {
    case "day":
    case "week": {
      const shift = range === "day" ? 1 : 7;
      const date = keyToUtcDate(anchor);
      date.setUTCDate(date.getUTCDate() - shift);
      return rangeDayKeys(range === "day" ? "day" : "week", utcDateToKey(date));
    }
    case "month": {
      const [year, month] = anchor.split("-").map(Number);
      const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 2, 1));
      return rangeDayKeys(
        "month",
        `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`,
      );
    }
    case "year":
      return rangeDayKeys("year", String(Number(anchor) - 1));
  }
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** User-facing range label for card headers and CSV metadata. */
export function rangeLabel(range: RevenueRange, anchor: string): string {
  switch (range) {
    case "day": {
      const [, month, day] = anchor.split("-");
      return `Ngày ${day}/${month}/${anchor.slice(0, 4)}`;
    }
    case "week": {
      const keys = rangeDayKeys("week", anchor);
      const first = keys[0] ?? anchor;
      const last = keys[keys.length - 1] ?? anchor;
      return `Tuần ${first.slice(8, 10)}/${first.slice(5, 7)} – ${last.slice(8, 10)}/${last.slice(5, 7)}/${last.slice(0, 4)}`;
    }
    case "month":
      return `Tháng ${anchor.slice(5, 7)}/${anchor.slice(0, 4)}`;
    case "year":
      return `Năm ${anchor}`;
  }
}

export type SeriesBucket = { key: string; label: string };

/**
 * Ordered chart buckets covering the whole range, including empty ones so
 * the trend line keeps its shape. day -> 24 hourly slots, week -> 7 weekday
 * labels, month -> day-of-month labels, year -> 12 month labels.
 */
export function seriesBuckets(
  range: RevenueRange,
  anchor: string,
): SeriesBucket[] {
  switch (range) {
    case "day":
      return Array.from({ length: 24 }, (_, hour) => ({
        key: pad(hour),
        label: `${hour}h`,
      }));
    case "week":
      return rangeDayKeys("week", anchor).map((key) => ({
        key,
        label: `${WEEKDAY_LABELS[keyToUtcDate(key).getUTCDay()]} ${key.slice(8, 10)}/${key.slice(5, 7)}`,
      }));
    case "month":
      return rangeDayKeys("month", anchor).map((key) => ({
        key,
        label: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
      }));
    case "year":
      return Array.from({ length: 12 }, (_, index) => ({
        key: `${anchor}-${pad(index + 1)}`,
        label: `T${index + 1}`,
      }));
  }
}

/** Map one payment timestamp to its series bucket key. */
export function seriesBucketKey(
  range: RevenueRange,
  paidAt: Date,
  timeZone: string = REVENUE_TIME_ZONE,
): string {
  switch (range) {
    case "day":
      return hourKey(paidAt, timeZone);
    case "week":
    case "month":
      return dayKey(paidAt, timeZone);
    case "year":
      return monthKey(paidAt, timeZone);
  }
}
