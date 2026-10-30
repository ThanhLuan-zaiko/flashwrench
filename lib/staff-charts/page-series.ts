// Pure series builders for the one-chart-per-page staff screens. Each
// takes the list a page already loads and returns chart-ready numbers,
// so most page charts need no extra API call.
import { dayKey, MECHANIC_TIME_ZONE } from "@/lib/mechanic/mechanic-period";
import { shiftDayKey } from "@/lib/mechanic/mechanic-stats-daily";

export type LabeledValue = { key: string; label: string; value: number };

/** Groups items by key and sums `amountOf` (1 per item by default). */
export function groupTotals<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  labelOf: (item: T) => string,
  amountOf: (item: T) => number = () => 1,
): LabeledValue[] {
  const map = new Map<string, LabeledValue>();
  for (const item of items) {
    const key = keyOf(item);
    const entry = map.get(key) ?? { key, label: labelOf(item), value: 0 };
    entry.value += amountOf(item);
    map.set(key, entry);
  }
  return [...map.values()].sort(
    (a, b) => b.value - a.value || a.label.localeCompare(b.label, "vi"),
  );
}

/** The N lowest stock lines among active parts, lowest first. */
export function lowestStock<
  T extends { id: string; name: string; stockQty: number; isActive: boolean },
>(parts: readonly T[], limit = 6): LabeledValue[] {
  return parts
    .filter((part) => part.isActive)
    .sort(
      (a, b) => a.stockQty - b.stockQty || a.name.localeCompare(b.name, "vi"),
    )
    .slice(0, limit)
    .map((part) => ({ key: part.id, label: part.name, value: part.stockQty }));
}

export type CampaignUsage = LabeledValue & { limit: number; ratio: number };

/** Granted vs total limit for live campaigns, most used first. */
export function campaignUsage<
  T extends {
    id: string;
    name: string;
    grantedCount: number;
    totalLimit: number;
    isActive: boolean;
    isDeleted: boolean;
  },
>(campaigns: readonly T[], limit = 6): CampaignUsage[] {
  return campaigns
    .filter((campaign) => campaign.isActive && !campaign.isDeleted)
    .map((campaign) => ({
      key: campaign.id,
      label: campaign.name,
      value: campaign.grantedCount,
      limit: campaign.totalLimit,
      ratio:
        campaign.totalLimit > 0
          ? Math.min(1, campaign.grantedCount / campaign.totalLimit)
          : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export type DayCount = { day: string; value: number };

/** Jobs per day from today over the next N days (shop zone). */
export function upcomingLoad<
  T extends { scheduledAt: string | null; status: string },
>(
  jobs: readonly T[],
  now: Date,
  days = 7,
  timeZone = MECHANIC_TIME_ZONE,
): DayCount[] {
  const today = dayKey(now, timeZone);
  const points = Array.from({ length: days }, (_, index) => ({
    day: shiftDayKey(today, -index),
    value: 0,
  }));
  const byDay = new Map(points.map((point) => [point.day, point]));
  for (const job of jobs) {
    if (!job.scheduledAt || job.status === "cancelled") continue;
    const at = new Date(job.scheduledAt);
    if (!Number.isFinite(at.getTime())) continue;
    const point = byDay.get(dayKey(at, timeZone));
    if (point) point.value += 1;
  }
  return points;
}

/** Amount received per day over the last N days (shop zone). */
export function receivedByDay<
  T extends { stamp: string | null; received: number },
>(
  entries: readonly T[],
  now: Date,
  days = 30,
  timeZone = MECHANIC_TIME_ZONE,
): DayCount[] {
  const today = dayKey(now, timeZone);
  const points = Array.from({ length: days }, (_, index) => ({
    day: shiftDayKey(today, days - 1 - index),
    value: 0,
  }));
  const byDay = new Map(points.map((point) => [point.day, point]));
  for (const entry of entries) {
    if (!entry.stamp || entry.received <= 0) continue;
    const at = new Date(entry.stamp);
    if (!Number.isFinite(at.getTime())) continue;
    const point = byDay.get(dayKey(at, timeZone));
    if (point) point.value += entry.received;
  }
  return points;
}

/** "15/9" style axis label for a day key. */
export function shortDay(key: string): string {
  const [, month, day] = key.split("-").map(Number);
  return `${day}/${month}`;
}
