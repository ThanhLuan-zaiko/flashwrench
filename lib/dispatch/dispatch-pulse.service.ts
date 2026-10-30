// Live operations pulse for dispatchers: hourly load today vs yesterday,
// the status funnel, first-response time, open rescues with their wait
// timers and today's revenue — one call so the board header renders every
// card from a single round-trip.
import { countRescueRefsByStatus } from "@/lib/admin/admin-dashboard.repository";
import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import {
  dayKey,
  MECHANIC_TIME_ZONE,
  monthKey,
} from "@/lib/mechanic/mechanic-period";
import { MECHANIC_BOOKING_STATUSES } from "@/lib/mechanic/mechanic-status";
import { listStatusBookingRefs } from "./dispatch.repository";
import {
  bucketByHour,
  buildFunnel,
  buildRescueSteps,
  completionRate,
  currentHourOf,
  previousDayKey,
  RESCUE_STAGES,
  type StatusRefs,
  sum,
} from "./dispatch-pulse";
import type { DispatchPulse } from "./dispatch-pulse.types";
import {
  RESPONSE_THRESHOLD_MINUTES,
  summarizeResponses,
} from "./dispatch-pulse-response";
import {
  loadOpenRescues,
  loadTodayRevenue,
  sampleResponseMinutes,
} from "./dispatch-pulse-sources";

const STATUS_PAGE_LIMIT = 500;
const STAFF_ROLES = new Set(["dispatcher", "admin"]);

// Today and yesterday can straddle a month boundary: read both buckets.
function monthBuckets(now: Date): string[] {
  const today = dayKey(now, MECHANIC_TIME_ZONE);
  const yesterdayNoon = new Date(`${previousDayKey(today)}T12:00:00+07:00`);
  return [
    ...new Set([
      monthKey(now, MECHANIC_TIME_ZONE),
      monthKey(yesterdayNoon, MECHANIC_TIME_ZONE),
    ]),
  ];
}

type StatusGroup = StatusRefs & { todayIds: string[] };

export async function getDispatchPulse(
  actor: PublicUser,
  now = new Date(),
): Promise<WorkspaceResult<DispatchPulse>> {
  if (!STAFF_ROLES.has(actor.role)) {
    return {
      ok: false,
      status: 403,
      errors: { form: "Bạn không có quyền xem nhịp vận hành." },
    };
  }

  const today = dayKey(now, MECHANIC_TIME_ZONE);
  const months = monthBuckets(now);
  let truncated = false;
  const groups: StatusGroup[] = await Promise.all(
    MECHANIC_BOOKING_STATUSES.map(async (status) => {
      const pages = await Promise.all(
        months.map((month) =>
          listStatusBookingRefs(status, month, STATUS_PAGE_LIMIT),
        ),
      );
      if (pages.some((page) => page.pageState)) truncated = true;
      const rows = pages.flatMap((page) => page.rows);
      return {
        status,
        scheduledAt: rows.map((row) => row.scheduled_at),
        todayIds: rows
          .filter(
            (row) =>
              row.scheduled_at instanceof Date &&
              dayKey(row.scheduled_at, MECHANIC_TIME_ZONE) === today,
          )
          .map((row) => row.booking_id),
      };
    }),
  );

  // Every booking that already left "pending" has a first response.
  const handledIds = groups
    .filter((group) => group.status !== "pending")
    .flatMap((group) => group.todayIds);
  const rescueStatuses = Object.values(RESCUE_STAGES).flat();
  const [minutes, openRescues, revenue, rescueCountPairs] = await Promise.all([
    sampleResponseMinutes(handledIds),
    loadOpenRescues(),
    loadTodayRevenue(actor),
    Promise.all(
      rescueStatuses.map(
        async (status) =>
          [status, await countRescueRefsByStatus(status)] as const,
      ),
    ),
  ]);

  const buckets = bucketByHour(groups, now, MECHANIC_TIME_ZONE);
  const funnel = buildFunnel(buckets.todayByStatus);
  return {
    ok: true,
    data: {
      day: today,
      currentHour: currentHourOf(now, MECHANIC_TIME_ZONE),
      today: buckets.today,
      yesterday: buckets.yesterday,
      todayTotal: sum(buckets.today),
      yesterdayTotal: sum(buckets.yesterday),
      funnel,
      cancelledToday:
        (buckets.todayByStatus.get("cancelled") ?? 0) +
        (buckets.todayByStatus.get("no_show") ?? 0),
      completionRate: completionRate(funnel),
      rescues: buildRescueSteps(new Map(rescueCountPairs)),
      openRescues,
      response: {
        ...summarizeResponses(minutes),
        thresholdMinutes: RESPONSE_THRESHOLD_MINUTES,
      },
      revenue,
      truncated,
    },
  };
}
