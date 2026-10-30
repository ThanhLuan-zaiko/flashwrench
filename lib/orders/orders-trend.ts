// Pure aggregation for the parts-order trend: orders placed per day over
// the last N days (shop zone) with their value. Cancelled and refunded
// orders count as placed but add no value.
import { dayKey, MECHANIC_TIME_ZONE } from "@/lib/mechanic/mechanic-period";
import { shiftDayKey } from "@/lib/mechanic/mechanic-stats-daily";
import type { OrderTrendRow } from "./orders-trend.repository";

export const ORDER_TREND_DAYS = 14;
const VOID_STATUSES = new Set(["cancelled", "refunded"]);

export type OrderTrendPoint = {
  day: string;
  count: number;
  value: number;
};

export type OrderTrendGroup = {
  status: string;
  rows: OrderTrendRow[];
};

export function buildOrderTrend(
  groups: readonly OrderTrendGroup[],
  now: Date,
  days = ORDER_TREND_DAYS,
  timeZone = MECHANIC_TIME_ZONE,
): OrderTrendPoint[] {
  const today = dayKey(now, timeZone);
  const points = Array.from({ length: days }, (_, index) => ({
    day: shiftDayKey(today, days - 1 - index),
    count: 0,
    value: 0,
  }));
  const byDay = new Map(points.map((point) => [point.day, point]));
  for (const group of groups) {
    const voided = VOID_STATUSES.has(group.status);
    for (const row of group.rows) {
      if (!row.created_at) continue;
      const point = byDay.get(dayKey(row.created_at, timeZone));
      if (!point) continue;
      point.count += 1;
      if (!voided) point.value += Math.max(0, row.total ?? 0);
    }
  }
  return points;
}

/** Month buckets touched by the last N days, newest first. */
export function trendMonthBuckets(
  now: Date,
  days = ORDER_TREND_DAYS,
  timeZone = MECHANIC_TIME_ZONE,
): string[] {
  const today = dayKey(now, timeZone);
  const oldest = shiftDayKey(today, days - 1);
  return [...new Set([today.slice(0, 7), oldest.slice(0, 7)])];
}
