import { dayKey } from "@/lib/mechanic/mechanic-period";
import {
  isOpenBookingStatus,
  MECHANIC_BOOKING_STATUSES,
} from "@/lib/mechanic/mechanic-status";
import {
  addMetricMoney,
  type BookingMetric,
  metricCoverage,
  metricMoney,
  type OperationsSnapshot,
  validMetricDate,
} from "./metrics.types";

export function isMetricMonth(month: string): boolean {
  return /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(month);
}

export function operationsSnapshot(
  records: BookingMetric[],
  month: string,
  now: Date,
): OperationsSnapshot {
  if (!isMetricMonth(month)) throw new Error("Invalid metric month.");
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const scope: OperationsSnapshot["scope"] = {
    ...metricCoverage(now),
    kind: "scheduled-month",
    month,
  };
  const totals: OperationsSnapshot["totals"] = {
    bookings: 0,
    open: 0,
    unassigned: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    bookingValue: 0,
    collected: 0,
    outstanding: 0,
    completionRate: 0,
  };
  const statuses = MECHANIC_BOOKING_STATUSES.map((status) => ({
    status,
    count: 0,
  }));
  const daily = Array.from({ length: days }, (_, index) => ({
    day: `${month}-${String(index + 1).padStart(2, "0")}`,
    bookings: 0,
    completed: 0,
    value: 0,
  }));
  const byDay = new Map(daily.map((point) => [point.day, point]));
  const seen = new Set<string>();
  for (const { booking, status, payments, completedAt } of records) {
    if (seen.has(booking.booking_id) || booking.month_bucket !== month)
      continue;
    seen.add(booking.booking_id);
    const total = metricMoney(booking.total);
    totals.bookings += 1;
    const statusPoint = statuses.find((point) => point.status === status);
    if (statusPoint) statusPoint.count += 1;
    if (isOpenBookingStatus(status)) {
      totals.open += 1;
      if (!booking.mechanic_id) totals.unassigned += 1;
    }
    if (status === "completed") {
      totals.completed += 1;
      if (!validMetricDate(completedAt) || completedAt > now)
        scope.undatedCompletions += 1;
    }
    if (status === "cancelled") totals.cancelled += 1;
    if (status === "no_show") totals.noShow += 1;
    if (status !== "cancelled" && status !== "no_show") {
      totals.bookingValue = addMetricMoney(totals.bookingValue, total);
    }
    let paid = 0;
    const seenPayments = new Set<string>();
    for (const receipt of payments) {
      if (seenPayments.has(receipt.payment_id) || receipt.status !== "paid")
        continue;
      seenPayments.add(receipt.payment_id);
      paid = addMetricMoney(paid, metricMoney(receipt.amount));
      if (!validMetricDate(receipt.paid_at) || receipt.paid_at > now)
        scope.undatedPayments += 1;
    }
    totals.collected = addMetricMoney(totals.collected, paid);
    if (status === "completed" && booking.payment_status !== "refunded") {
      totals.outstanding = addMetricMoney(
        totals.outstanding,
        Math.max(0, total - paid),
      );
    }
    if (validMetricDate(booking.scheduled_at)) {
      const point = byDay.get(
        dayKey(booking.scheduled_at, booking.timezone ?? scope.timeZone),
      );
      if (point) {
        point.bookings += 1;
        if (status === "completed") point.completed += 1;
        if (status !== "cancelled" && status !== "no_show")
          point.value = addMetricMoney(point.value, total);
      } else scope.unplacedBookings += 1;
    } else scope.unplacedBookings += 1;
  }
  const settled = totals.completed + totals.cancelled + totals.noShow;
  totals.completionRate = settled
    ? Math.round((totals.completed / settled) * 100)
    : 0;
  return { scope, totals, statuses, daily };
}
