// Business logic for the performance page: completion counts, revenue
// buckets from the assigned workload plus ratings aggregated from real
// customer reviews (reviews_by_target). No mock numbers anywhere.

import {
  type MechanicBookingStatus,
  type MechanicMonthlyPoint,
  type MechanicRatingBucket,
  type MechanicResult,
  type MechanicReviewItem,
  type MechanicStats,
  toIso,
  toNumberOr,
} from "./mechanic.types";
import { listWorkloadRows } from "./mechanic-bookings.repository";
import { toBookingStatus } from "./mechanic-mapper";
import { isSameMonth, monthKey, recentMonthKeys } from "./mechanic-period";
import { isOpenBookingStatus } from "./mechanic-status";
import {
  findMechanicProfileRow,
  listReviewRowsByTarget,
} from "./mechanic-workspace.repository";

export const MECHANIC_STATS_SCAN_LIMIT = 500;
export const MECHANIC_REVIEW_LIMIT = 50;
const MONTHLY_SERIES_MONTHS = 6;
const TOP_REVIEWS = 5;
const MAX_STARS = 5;
const REVIEW_TARGET_TYPE = "mechanic";

export type MechanicStatsPayload = {
  stats: MechanicStats;
  monthly: MechanicMonthlyPoint[];
  ratings: MechanicRatingBucket[];
  reviews: MechanicReviewItem[];
};

export type MechanicStatsParams = {
  now?: Date;
};

function emptyStats(): MechanicStats {
  return {
    openJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    noShowJobs: 0,
    completedThisMonth: 0,
    revenueTotal: 0,
    revenueThisMonth: 0,
    ratingAvg: 0,
    ratingCount: 0,
    completionRate: 0,
  };
}

function completionStamp(scheduledAt: Date | null): Date | null {
  // bookings_by_mechanic carries only scheduled_at (no completion column),
  // so month attribution uses the schedule. Day/week/month revenue lands on
  // the day the job was scheduled to run.
  return scheduledAt;
}

function rateSum(ratings: number[]): { sum: number; count: number } {
  return ratings.reduce(
    (accumulator, rating) => ({
      sum: accumulator.sum + rating,
      count: accumulator.count + 1,
    }),
    { sum: 0, count: 0 },
  );
}

export async function getMechanicStats(
  mechanicId: string,
  params: MechanicStatsParams = {},
): Promise<MechanicResult<MechanicStatsPayload>> {
  const reference = params.now ?? new Date();
  const [rows, profile, reviewRows] = await Promise.all([
    listWorkloadRows(mechanicId, MECHANIC_STATS_SCAN_LIMIT),
    findMechanicProfileRow(mechanicId),
    listReviewRowsByTarget(
      REVIEW_TARGET_TYPE,
      mechanicId,
      MECHANIC_REVIEW_LIMIT,
    ),
  ]);

  const stats = emptyStats();
  const monthKeys = recentMonthKeys(reference, MONTHLY_SERIES_MONTHS);
  const monthly: MechanicMonthlyPoint[] = monthKeys.map((month) => ({
    month,
    completed: 0,
    revenue: 0,
  }));
  const monthlyByKey = new Map(monthly.map((point) => [point.month, point]));

  for (const row of rows) {
    const status = toBookingStatus(row.status);
    if (!status) continue;
    if (isOpenBookingStatus(status)) {
      stats.openJobs += 1;
      continue;
    }
    if (status === "completed") {
      stats.completedJobs += 1;
      const total = toNumberOr(row.total);
      stats.revenueTotal += total;
      const stamp = completionStamp(row.scheduled_at);
      if (!stamp) continue;
      const key = monthKey(stamp);
      const point = monthlyByKey.get(key);
      if (point) {
        point.completed += 1;
        point.revenue += total;
      }
      if (isSameMonth(stamp, reference)) {
        stats.completedThisMonth += 1;
        stats.revenueThisMonth += total;
      }
    } else if (status === "cancelled") {
      stats.cancelledJobs += 1;
    } else if (status === "no_show") {
      stats.noShowJobs += 1;
    }
  }

  const validRatings = reviewRows
    .map((row) => row.rating ?? 0)
    .filter((rating) => rating >= 1 && rating <= MAX_STARS);
  const { sum, count } = rateSum(validRatings);
  const profileAvg = profile?.rating_avg ?? 0;
  stats.ratingAvg =
    count > 0
      ? Math.round((sum / count) * 10) / 10
      : Math.round((profileAvg ?? 0) * 10) / 10;
  stats.ratingCount = count > 0 ? count : (profile?.rating_count ?? 0);

  const ratings: MechanicRatingBucket[] = [];
  for (let stars = MAX_STARS; stars >= 1; stars -= 1) {
    ratings.push({
      stars,
      count: validRatings.filter((rating) => rating === stars).length,
    });
  }

  const reviews: MechanicReviewItem[] = reviewRows.slice(0, TOP_REVIEWS).map(
    (row): MechanicReviewItem => ({
      id: row.review_id,
      customerName: row.customer_name ?? "",
      rating: row.rating ?? 0,
      comment: [row.title, row.body]
        .map((part) => part ?? "")
        .filter((part) => part.length > 0)
        .join(" — "),
      createdAt: toIso(row.created_at),
    }),
  );

  const settled = stats.completedJobs + stats.cancelledJobs + stats.noShowJobs;
  stats.completionRate =
    settled > 0 ? Math.round((stats.completedJobs / settled) * 100) : 0;

  return { ok: true, data: { stats, monthly, ratings, reviews } };
}

export type { MechanicBookingStatus };
