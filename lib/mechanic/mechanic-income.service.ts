// Business logic for the income page: billable bookings joined with their
// payment rows, then summarized per Vietnam-local day/week/month.

import {
  type MechanicIncomeEntry,
  type MechanicIncomeState,
  type MechanicIncomeSummary,
  type MechanicPaymentRow,
  type MechanicResult,
  type MechanicWorkloadRow,
  toIso,
  toNumberOr,
} from "./mechanic.types";
import { listWorkloadRows } from "./mechanic-bookings.repository";
import { toBookingStatus } from "./mechanic-mapper";
import { isSameDay, isSameMonth, isSameWeek } from "./mechanic-period";
import { listPaymentRowsByRefIds } from "./mechanic-workspace.repository";

export const MECHANIC_INCOME_LIMIT = 30;
export const MECHANIC_INCOME_SCAN_LIMIT = 200;
const PAYMENT_REF_TYPE = "booking";

export type MechanicIncomePayload = {
  summary: MechanicIncomeSummary;
  entries: MechanicIncomeEntry[];
  /** true when older bookings were left out of the summary scan. */
  truncated: boolean;
};

export type MechanicIncomeParams = {
  limit?: number;
  now?: Date;
};

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
    return MECHANIC_INCOME_LIMIT;
  }
  return Math.min(Math.trunc(limit), MECHANIC_INCOME_SCAN_LIMIT);
}

function isBillable(status: string | null): boolean {
  return (
    status === "completed" || status === "cancelled" || status === "no_show"
  );
}

function hasPaymentWithStatus(
  payments: MechanicPaymentRow[],
  status: string,
): boolean {
  return payments.some((payment) => payment.status === status);
}

function paidStamp(payments: MechanicPaymentRow[]): Date | null {
  const paid = payments.filter(
    (payment) => payment.status === "paid" && payment.paid_at,
  );
  if (paid.length === 0) return null;
  return (
    paid
      .map((payment) => new Date(payment.paid_at as Date))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  );
}

function paymentMethod(payments: MechanicPaymentRow[]): string {
  return payments.find((payment) => payment.method)?.method ?? "";
}

// A booking becomes a transaction only when money actually moved or is
// still expected: completed jobs (paid or awaiting payment) and cancelled
// jobs that were refunded. Cancelled jobs without a payment never show up.
function resolveEntry(
  booking: MechanicWorkloadRow,
  payments: MechanicPaymentRow[],
): { entry: MechanicIncomeEntry; state: MechanicIncomeState } | null {
  const bookingStatus = toBookingStatus(booking.status);
  if (!bookingStatus) return null;
  const refunded = hasPaymentWithStatus(payments, "refunded");
  const paid = hasPaymentWithStatus(payments, "paid");

  let state: MechanicIncomeState | null = null;
  if (refunded) state = "refunded";
  else if (bookingStatus === "completed") state = paid ? "paid" : "pending";
  if (!state) return null;

  const stamp =
    paidStamp(payments) ??
    (bookingStatus === "completed" && booking.scheduled_at
      ? booking.scheduled_at
      : null);

  return {
    state,
    entry: {
      bookingId: booking.booking_id,
      customerName: booking.customer_name ?? "",
      vehiclePlate: booking.vehicle_plate ?? "",
      total: toNumberOr(booking.total),
      state,
      bookingStatus,
      method: paymentMethod(payments),
      stamp: toIso(stamp),
    },
  };
}

function emptySummary(): MechanicIncomeSummary {
  return {
    today: 0,
    week: 0,
    month: 0,
    lifetime: 0,
    pendingTotal: 0,
    paidCount: 0,
    pendingCount: 0,
  };
}

function addToSummary(
  summary: MechanicIncomeSummary,
  entry: MechanicIncomeEntry,
  reference: Date,
): void {
  if (entry.state === "pending") {
    summary.pendingTotal += entry.total;
    summary.pendingCount += 1;
    return;
  }
  if (entry.state !== "paid") return;
  const stamp = entry.stamp ? new Date(entry.stamp) : null;
  summary.paidCount += 1;
  summary.lifetime += entry.total;
  if (!stamp) return;
  if (isSameDay(stamp, reference)) summary.today += entry.total;
  if (isSameWeek(stamp, reference)) summary.week += entry.total;
  if (isSameMonth(stamp, reference)) summary.month += entry.total;
}

export async function getMechanicIncome(
  mechanicId: string,
  params: MechanicIncomeParams = {},
): Promise<MechanicResult<MechanicIncomePayload>> {
  const reference = params.now ?? new Date();
  const rows = await listWorkloadRows(mechanicId, MECHANIC_INCOME_SCAN_LIMIT);
  const billable = rows.filter((row) => isBillable(row.status));
  const payments = await listPaymentRowsByRefIds(
    PAYMENT_REF_TYPE,
    billable.map((row) => row.booking_id),
  );
  const paymentsByBooking = new Map<string, MechanicPaymentRow[]>();
  for (const payment of payments) {
    const current = paymentsByBooking.get(payment.ref_id);
    if (current) current.push(payment);
    else paymentsByBooking.set(payment.ref_id, [payment]);
  }

  const summary = emptySummary();
  const entries: MechanicIncomeEntry[] = [];
  for (const booking of billable) {
    const resolved = resolveEntry(
      booking,
      paymentsByBooking.get(booking.booking_id) ?? [],
    );
    if (!resolved) continue;
    addToSummary(summary, resolved.entry, reference);
    entries.push(resolved.entry);
  }

  entries.sort((a, b) => {
    const left = a.stamp ? new Date(a.stamp).getTime() : 0;
    const right = b.stamp ? new Date(b.stamp).getTime() : 0;
    return right - left;
  });

  return {
    ok: true,
    data: {
      summary,
      entries: entries.slice(0, resolveLimit(params.limit)),
      truncated: rows.length >= MECHANIC_INCOME_SCAN_LIMIT,
    },
  };
}
