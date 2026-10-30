// Pure day-level series for the mechanic performance page: the last 7
// days of income, this week vs last week, a 12-week completion heatmap,
// the working streak and the busiest weekday. Days use the shop zone.
import { dayKey, MECHANIC_TIME_ZONE } from "./mechanic-period";

export const WEEK_DAYS = 7;
export const HEATMAP_DAYS = 84;

export type DailyJob = {
  scheduledAt: Date | null;
  completed: boolean;
  total: number;
};

export type MechanicDayPoint = {
  day: string;
  completed: number;
  revenue: number;
};

export type MechanicDaily = {
  /** Last 7 days, oldest first; the last entry is today. */
  week: MechanicDayPoint[];
  weekRevenue: number;
  previousWeekRevenue: number;
  weekCompleted: number;
  previousWeekCompleted: number;
  /** Last 84 days of completions, oldest first, for the heatmap. */
  heatmap: MechanicDayPoint[];
  /** Consecutive days with a completed job, ending today or yesterday. */
  streak: number;
  /** 0 = Monday … 6 = Sunday; null when there is no completed job. */
  busiestWeekday: number | null;
};

/** Day key `offset` days before the given key (zone-free calendar math). */
export function shiftDayKey(key: string, offset: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

/** Monday-first weekday of a day key: 0 = Monday … 6 = Sunday. */
export function weekdayOf(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  const sunday0 = new Date(
    Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1),
  ).getUTCDay();
  return (sunday0 + 6) % 7;
}

function emptyDays(today: string, count: number): MechanicDayPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    day: shiftDayKey(today, count - 1 - index),
    completed: 0,
    revenue: 0,
  }));
}

function streakOf(byDay: Map<string, MechanicDayPoint>, today: string): number {
  // A day without jobs yet should not break yesterday's streak.
  let cursor =
    (byDay.get(today)?.completed ?? 0) > 0 ? today : shiftDayKey(today, 1);
  let streak = 0;
  while ((byDay.get(cursor)?.completed ?? 0) > 0) {
    streak += 1;
    cursor = shiftDayKey(cursor, 1);
  }
  return streak;
}

export function buildMechanicDaily(
  jobs: readonly DailyJob[],
  now: Date,
  timeZone = MECHANIC_TIME_ZONE,
): MechanicDaily {
  const today = dayKey(now, timeZone);
  const heatmap = emptyDays(today, HEATMAP_DAYS);
  const byDay = new Map(heatmap.map((point) => [point.day, point]));

  for (const job of jobs) {
    if (!job.completed) continue;
    if (!(job.scheduledAt instanceof Date)) continue;
    if (!Number.isFinite(job.scheduledAt.getTime())) continue;
    const point = byDay.get(dayKey(job.scheduledAt, timeZone));
    if (!point) continue;
    point.completed += 1;
    point.revenue += Math.max(0, job.total);
  }

  const week = heatmap.slice(-WEEK_DAYS);
  const previousWeek = heatmap.slice(-WEEK_DAYS * 2, -WEEK_DAYS);
  const add = (points: MechanicDayPoint[], field: "completed" | "revenue") =>
    points.reduce((sum, point) => sum + point[field], 0);

  const perWeekday = new Array<number>(WEEK_DAYS).fill(0);
  for (const point of heatmap) {
    const index = weekdayOf(point.day);
    perWeekday[index] = (perWeekday[index] ?? 0) + point.completed;
  }
  const best = Math.max(...perWeekday);

  return {
    week: week.map((point) => ({ ...point })),
    weekRevenue: add(week, "revenue"),
    previousWeekRevenue: add(previousWeek, "revenue"),
    weekCompleted: add(week, "completed"),
    previousWeekCompleted: add(previousWeek, "completed"),
    heatmap,
    streak: streakOf(byDay, today),
    busiestWeekday: best > 0 ? perWeekday.indexOf(best) : null,
  };
}
