// Pure aggregation for the dispatch pulse: buckets booking refs by hour
// for today and yesterday and folds statuses into the board funnel. No
// I/O, so the math is unit-testable.
import {
  dayKey,
  hourKey,
  MECHANIC_TIME_ZONE,
} from "@/lib/mechanic/mechanic-period";
import type {
  PulseFunnelStage,
  PulseFunnelStep,
  PulseRescueStage,
  PulseRescueStep,
} from "./dispatch-pulse.types";

export const FUNNEL_STAGES: Record<PulseFunnelStage, readonly string[]> = {
  waiting: ["pending"],
  assigned: ["confirmed", "mechanic_assigned"],
  working: ["en_route", "in_progress"],
  done: ["completed"],
};

export const RESCUE_STAGES: Record<PulseRescueStage, readonly string[]> = {
  waiting: ["open", "dispatched"],
  moving: ["accepted", "en_route"],
  onsite: ["arrived"],
};

/** Statuses that do not count toward hourly load or completion. */
const DROPPED_STATUSES = new Set(["cancelled", "no_show"]);

const HOURS_PER_DAY = 24;

export type StatusRefs = {
  status: string;
  scheduledAt: (Date | null)[];
};

/** Previous calendar day key, computed on the key itself (zone-safe). */
export function previousDayKey(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function currentHourOf(now: Date, timeZone = MECHANIC_TIME_ZONE) {
  return Number.parseInt(hourKey(now, timeZone), 10);
}

export type HourlyBuckets = {
  today: number[];
  yesterday: number[];
  todayByStatus: Map<string, number>;
};

export function bucketByHour(
  groups: readonly StatusRefs[],
  now: Date,
  timeZone = MECHANIC_TIME_ZONE,
): HourlyBuckets {
  const todayKey = dayKey(now, timeZone);
  const yesterdayKey = previousDayKey(todayKey);
  const currentHour = currentHourOf(now, timeZone);
  const today = new Array<number>(HOURS_PER_DAY).fill(0);
  const yesterday = new Array<number>(HOURS_PER_DAY).fill(0);
  const todayByStatus = new Map<string, number>();

  for (const group of groups) {
    for (const at of group.scheduledAt) {
      if (!(at instanceof Date) || Number.isNaN(at.getTime())) continue;
      const key = dayKey(at, timeZone);
      if (key === todayKey) {
        todayByStatus.set(
          group.status,
          (todayByStatus.get(group.status) ?? 0) + 1,
        );
      }
      if (DROPPED_STATUSES.has(group.status)) continue;
      const hour = Number.parseInt(hourKey(at, timeZone), 10);
      if (key === todayKey) today[hour] = (today[hour] ?? 0) + 1;
      else if (key === yesterdayKey)
        yesterday[hour] = (yesterday[hour] ?? 0) + 1;
    }
  }
  return { today: today.slice(0, currentHour + 1), yesterday, todayByStatus };
}

export function buildFunnel(byStatus: Map<string, number>): PulseFunnelStep[] {
  return (Object.keys(FUNNEL_STAGES) as PulseFunnelStage[]).map((stage) => ({
    stage,
    count: FUNNEL_STAGES[stage].reduce(
      (sum, status) => sum + (byStatus.get(status) ?? 0),
      0,
    ),
  }));
}

export function buildRescueSteps(
  counts: ReadonlyMap<string, number>,
): PulseRescueStep[] {
  return (Object.keys(RESCUE_STAGES) as PulseRescueStage[]).map((stage) => ({
    stage,
    count: RESCUE_STAGES[stage].reduce(
      (sum, status) => sum + (counts.get(status) ?? 0),
      0,
    ),
  }));
}

/** Completed share of the funnel; 0 when nothing is scheduled. */
export function completionRate(funnel: readonly PulseFunnelStep[]): number {
  const total = funnel.reduce((sum, step) => sum + step.count, 0);
  const done = funnel.find((step) => step.stage === "done")?.count ?? 0;
  return total > 0 ? done / total : 0;
}

export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
