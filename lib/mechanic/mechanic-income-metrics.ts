import {
  addMetricMoney,
  type BookingMetric,
  metricCoverage,
  metricMoney,
  validMetricDate,
} from "@/lib/operations/metrics.types";
import { isSameDay, isSameMonth, isSameWeek } from "./mechanic-period";
import type { MechanicIncomeState, MechanicIncomeSummary } from "./mechanic.types";
import {
  type IncomeMetricEntry,
  type MechanicIncomeSnapshot,
  metricPagination,
  validMetricPaging,
} from "./mechanic-metrics.types";

export function mechanicIncomeSnapshot(
  records: BookingMetric[],
  now: Date,
  options: { page?: number; pageSize?: number; state?: MechanicIncomeState | "all" } = {},
): MechanicIncomeSnapshot {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 8;
  if (!validMetricPaging(page, pageSize)) throw new Error("Invalid income pagination.");
  const state = options.state ?? "all";
  if (!["all", "paid", "pending", "refunded"].includes(state)) throw new Error("Invalid income state.");
  const scope: MechanicIncomeSnapshot["scope"] = { ...metricCoverage(now), kind: "assigned-history" };
  const summary: MechanicIncomeSummary = {
    today: 0, week: 0, month: 0, lifetime: 0, pendingTotal: 0, paidCount: 0, pendingCount: 0,
  };
  const entries: IncomeMetricEntry[] = [];
  const counts: MechanicIncomeSnapshot["counts"] = { all: 0, paid: 0, pending: 0, refunded: 0 };
  const seen = new Set<string>();
  for (const { booking, payments, status, completedAt } of records) {
    if (seen.has(booking.booking_id)) continue;
    seen.add(booking.booking_id);
    const total = metricMoney(booking.total);
    let received = 0;
    let stamp: Date | null = null;
    let method = "";
    let refunded = false;
    const paymentIds = new Set<string>();
    for (const payment of payments) {
      if (paymentIds.has(payment.payment_id)) continue;
      paymentIds.add(payment.payment_id);
      if (payment.status === "refunded") refunded = true;
      if (payment.status !== "paid") continue;
      const amount = metricMoney(payment.amount);
      received = addMetricMoney(received, amount);
      summary.lifetime = addMetricMoney(summary.lifetime, amount);
      summary.paidCount += 1;
      if (!validMetricDate(payment.paid_at) || payment.paid_at > now) {
        scope.undatedPayments += 1;
        continue;
      }
      if (!stamp || stamp < payment.paid_at) {
        stamp = payment.paid_at;
        method = payment.method ?? "";
      }
      if (isSameDay(payment.paid_at, now)) summary.today = addMetricMoney(summary.today, amount);
      if (isSameWeek(payment.paid_at, now)) summary.week = addMetricMoney(summary.week, amount);
      if (isSameMonth(payment.paid_at, now)) summary.month = addMetricMoney(summary.month, amount);
    }
    if (status === "completed" && (!validMetricDate(completedAt) || completedAt > now)) {
      scope.undatedCompletions += 1;
    }
    const outstanding = status === "completed" && booking.payment_status !== "refunded"
      ? Math.max(0, total - received) : 0;
    let entryState: MechanicIncomeState | null = null;
    if (status === "completed" && outstanding > 0) entryState = "pending";
    else if (received > 0 || (status === "completed" && booking.payment_status === "paid")) entryState = "paid";
    else if (refunded || booking.payment_status === "refunded") entryState = "refunded";
    else if (status === "completed") entryState = "pending";
    if (!entryState) continue;
    if (entryState === "pending") {
      summary.pendingTotal = addMetricMoney(summary.pendingTotal, outstanding);
      summary.pendingCount += 1;
    }
    counts[entryState] += 1;
    counts.all += 1;
    entries.push({
      bookingId: booking.booking_id,
      customerName: booking.customer_name ?? "",
      vehiclePlate: booking.vehicle_plate ?? "",
      total, received, outstanding, state: entryState, bookingStatus: status, method,
      stamp: (stamp ?? (validMetricDate(completedAt) && completedAt <= now ? completedAt : null))?.toISOString() ?? null,
    });
  }
  entries.sort((left, right) => (right.stamp ?? "").localeCompare(left.stamp ?? "") || left.bookingId.localeCompare(right.bookingId));
  const selected = state === "all" ? entries : entries.filter((entry) => entry.state === state);
  const pagination = metricPagination(selected.length, page, pageSize);
  const offset = (pagination.page - 1) * pagination.pageSize;
  return {
    summary, counts, scope, pagination, truncated: false,
    entries: selected.slice(offset, offset + pageSize),
  };
}
