// Response shape of GET /api/dispatch/pulse — the live operations pulse on
// top of the dispatch board.

export type PulseFunnelStage = "waiting" | "assigned" | "working" | "done";

export type PulseFunnelStep = {
  stage: PulseFunnelStage;
  count: number;
};

export type PulseRescueStage = "waiting" | "moving" | "onsite";

export type PulseRescueStep = {
  stage: PulseRescueStage;
  count: number;
};

export type PulseOpenRescue = {
  requestId: string;
  issueType: string | null;
  priority: string | null;
  status: string;
  stage: PulseRescueStage;
  /** ISO instant the request was filed; the client ticks the wait timer. */
  createdAt: string;
};

export type PulseResponse = {
  /** Mean minutes from booking creation to the first dispatcher action. */
  avgMinutes: number | null;
  samples: number;
  thresholdMinutes: number;
  /** Sampled bookings whose first response took longer than the threshold. */
  overThreshold: number;
};

export type PulseRevenue = {
  collected: number;
  /** Percent change vs yesterday; null when yesterday had no revenue. */
  percent: number | null;
  /** Collected per hour today, for the KPI sparkline. */
  series: number[];
};

export type DispatchPulse = {
  /** Day key (shop time zone) the series describe, e.g. "2026-09-15". */
  day: string;
  /** Current hour in the shop zone, 0-23; today's series stops there. */
  currentHour: number;
  /** Bookings scheduled per hour today, indexes 0..currentHour. */
  today: number[];
  /** Bookings scheduled per hour yesterday, all 24 hours. */
  yesterday: number[];
  todayTotal: number;
  yesterdayTotal: number;
  funnel: PulseFunnelStep[];
  cancelledToday: number;
  /** Completed share of today's non-cancelled bookings, 0..1. */
  completionRate: number;
  rescues: PulseRescueStep[];
  /** Oldest open rescues first, capped for the board header. */
  openRescues: PulseOpenRescue[];
  response: PulseResponse;
  revenue: PulseRevenue | null;
  /** True when a status partition hit the page cap; counts are partial. */
  truncated: boolean;
};
