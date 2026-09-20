import {
  addMetricMoney,
  type BookingMetric,
  metricCoverage,
  metricMoney,
  type RatingSnapshot,
  validMetricDate,
} from "@/lib/operations/metrics.types";
import type { MechanicStats } from "./mechanic.types";
import {
  type MechanicStatsSnapshot,
  metricPagination,
  validMetricPaging,
} from "./mechanic-metrics.types";
import { isSameMonth, monthKey, recentMonthKeys } from "./mechanic-period";
import { isOpenBookingStatus } from "./mechanic-status";

export function mechanicStatsSnapshot(
  records: BookingMetric[],
  ratings: RatingSnapshot,
  now: Date,
  reviewPage = 1,
  pageSize = 5,
): MechanicStatsSnapshot {
  if (!validMetricPaging(reviewPage, pageSize))
    throw new Error("Invalid review pagination.");
  const scope: MechanicStatsSnapshot["scope"] = {
    ...metricCoverage(now),
    kind: "assigned-history",
  };
  const stats: MechanicStats = {
    openJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    noShowJobs: 0,
    completedThisMonth: 0,
    revenueTotal: 0,
    revenueThisMonth: 0,
    ratingAvg: ratings.average,
    ratingCount: ratings.count,
    completionRate: 0,
  };
  const monthly = recentMonthKeys(now, 6).map((month) => ({
    month,
    completed: 0,
    revenue: 0,
  }));
  const byMonth = new Map(monthly.map((point) => [point.month, point]));
  const seen = new Set<string>();
  for (const { booking, status, payments, completedAt } of records) {
    if (seen.has(booking.booking_id)) continue;
    seen.add(booking.booking_id);
    if (isOpenBookingStatus(status)) stats.openJobs += 1;
    if (status === "cancelled") stats.cancelledJobs += 1;
    if (status === "no_show") stats.noShowJobs += 1;
    if (status === "completed") {
      stats.completedJobs += 1;
      if (validMetricDate(completedAt) && completedAt <= now) {
        const point = byMonth.get(monthKey(completedAt));
        if (point) point.completed += 1;
        if (isSameMonth(completedAt, now)) stats.completedThisMonth += 1;
      } else scope.undatedCompletions += 1;
    }
    const paymentIds = new Set<string>();
    for (const receipt of payments) {
      if (paymentIds.has(receipt.payment_id) || receipt.status !== "paid")
        continue;
      paymentIds.add(receipt.payment_id);
      const amount = metricMoney(receipt.amount);
      stats.revenueTotal = addMetricMoney(stats.revenueTotal, amount);
      if (!validMetricDate(receipt.paid_at) || receipt.paid_at > now) {
        scope.undatedPayments += 1;
        continue;
      }
      const point = byMonth.get(monthKey(receipt.paid_at));
      if (point) point.revenue = addMetricMoney(point.revenue, amount);
      if (isSameMonth(receipt.paid_at, now))
        stats.revenueThisMonth = addMetricMoney(stats.revenueThisMonth, amount);
    }
  }
  const settled = stats.completedJobs + stats.cancelledJobs + stats.noShowJobs;
  stats.completionRate = settled
    ? Math.round((stats.completedJobs / settled) * 100)
    : 0;
  const reviewPagination = metricPagination(
    ratings.reviews.length,
    reviewPage,
    pageSize,
  );
  const offset = (reviewPagination.page - 1) * pageSize;
  const reviews = ratings.reviews
    .slice(offset, offset + pageSize)
    .map((row) => ({
      id: row.review_id,
      customerName: row.customer_name ?? "",
      rating: row.rating ?? 0,
      comment: [row.title, row.body].filter(Boolean).join(" — "),
      createdAt: validMetricDate(row.created_at)
        ? row.created_at.toISOString()
        : null,
    }));
  return {
    stats,
    monthly,
    ratings: ratings.distribution,
    reviews,
    reviewPagination,
    scope,
  };
}
