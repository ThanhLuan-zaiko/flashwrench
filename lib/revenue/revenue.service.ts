// Revenue reporting + shared receipt projection. Every collection path
// (booking installments, order settlement, rescue cash) funnels through
// projectReceipt so payments_by_period and the audit feed stay the single
// revenue source of truth for dispatcher and admin screens.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { dayKey } from "@/lib/mechanic/mechanic-period";
import { findPaymentRowById } from "@/lib/payments/booking-payment.repository";
import {
  insertAuditEvent,
  insertPeriodRow,
  listAuditRows,
  listPeriodRows,
  updatePeriodRowStatus,
} from "./revenue.repository";
import type {
  AuditEventWrite,
  PaymentAuditEvent,
  PeriodPaymentRow,
  ReceiptProjectionWrite,
  RevenuePoint,
  RevenueReport,
  RevenueSlice,
  RevenueSource,
  RevenueTransaction,
} from "./revenue.types";
import { detectFraudFlags } from "./revenue-fraud";
import {
  isRevenueRange,
  normalizeRevenueAnchor,
  previousRangeDayKeys,
  REVENUE_TIME_ZONE,
  type RevenueRange,
  rangeDayKeys,
  rangeLabel,
  seriesBucketKey,
  seriesBuckets,
} from "./revenue-period";

const BUCKET_ROW_LIMIT = 500;
const REPORT_ROW_CAP = 4000;
const AUDIT_ROW_CAP = 300;
const FAN_OUT_CHUNK = 24;
const REVENUE_SOURCES: RevenueSource[] = ["booking", "order", "emergency"];

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

function isRevenueSource(value: string | null): value is RevenueSource {
  return REVENUE_SOURCES.includes(value as RevenueSource);
}

/** Day-keyed period row + one audit entry for every confirmed receipt. */
export async function projectReceipt(
  write: ReceiptProjectionWrite,
): Promise<void> {
  const bucket = dayKey(write.paidAt, REVENUE_TIME_ZONE);
  await insertPeriodRow({ ...write, bucket });
  await insertAuditEvent({
    eventId: randomUUID(),
    actorId: write.recordedBy,
    action: "recorded",
    refType: write.refType,
    refId: write.refId,
    paymentId: write.paymentId,
    amount: write.amount,
    method: write.method,
    detail: null,
    at: new Date(),
    bucket: dayKey(new Date(), REVENUE_TIME_ZONE),
  });
}

/** Non-receipt payment events: code issuance, failed codes, refunds. */
export async function recordAuditEvent(write: AuditEventWrite): Promise<void> {
  await insertAuditEvent({
    ...write,
    bucket: dayKey(write.at, REVENUE_TIME_ZONE),
  });
}

/**
 * Flip a receipt's period row to a terminal status (refunded) so reports
 * stop counting it. Looks up the original receipt for its paid_at bucket.
 */
export async function markReceiptRefunded(
  paymentId: string,
  actorId: string | null,
): Promise<void> {
  const row = await findPaymentRowById(paymentId);
  if (!row?.paid_at || !row.ref_type || !row.ref_id) return;
  if (!isRevenueSource(row.ref_type)) return;
  const bucket = dayKey(row.paid_at, REVENUE_TIME_ZONE);
  await updatePeriodRowStatus(bucket, row.paid_at, paymentId, "refunded");
  await insertAuditEvent({
    eventId: randomUUID(),
    actorId,
    action: "refund_marked",
    refType: row.ref_type,
    refId: row.ref_id,
    paymentId,
    amount: row.amount,
    method: row.method,
    detail: null,
    at: new Date(),
    bucket: dayKey(new Date(), REVENUE_TIME_ZONE),
  });
}

function toTransaction(row: PeriodPaymentRow): RevenueTransaction | null {
  if (!isRevenueSource(row.ref_type) || !row.ref_id) return null;
  return {
    paymentId: row.payment_id,
    refType: row.ref_type,
    refId: row.ref_id,
    customerId: row.customer_id,
    mechanicId: row.mechanic_id,
    recordedBy: row.recorded_by,
    amount: row.amount ?? 0,
    method: row.method,
    status: row.status,
    customerConfirmed: row.customer_confirmed,
    paidAt: row.paid_at ? row.paid_at.toISOString() : null,
  };
}

// Bounded fan-out over day partitions; Scylla keeps each bucket small and
// chunking avoids a 366-query burst on year reports.
async function listRowsForBuckets(buckets: string[]): Promise<{
  rows: PeriodPaymentRow[];
  truncated: boolean;
}> {
  const rows: PeriodPaymentRow[] = [];
  let truncated = false;
  for (let index = 0; index < buckets.length; index += FAN_OUT_CHUNK) {
    const chunk = buckets.slice(index, index + FAN_OUT_CHUNK);
    const results = await Promise.all(
      chunk.map((bucket) => listPeriodRows(bucket, BUCKET_ROW_LIMIT)),
    );
    for (const result of results) {
      if (result.length >= BUCKET_ROW_LIMIT) truncated = true;
      rows.push(...result);
    }
    if (rows.length >= REPORT_ROW_CAP) {
      truncated = true;
      break;
    }
  }
  return { rows: rows.slice(0, REPORT_ROW_CAP), truncated };
}

function sumPaid(rows: PeriodPaymentRow[]): number {
  return rows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);
}

function sliceRows(
  rows: PeriodPaymentRow[],
  keyOf: (row: PeriodPaymentRow) => string | null,
): RevenueSlice[] {
  const map = new Map<string, RevenueSlice>();
  for (const row of rows) {
    if (row.status !== "paid") continue;
    const key = keyOf(row);
    if (!key) continue;
    const slice = map.get(key) ?? { key, amount: 0, count: 0 };
    slice.amount += row.amount ?? 0;
    slice.count += 1;
    map.set(key, slice);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

type RevenueParams = { range?: unknown; anchor?: unknown };

async function buildReport(
  params: RevenueParams,
  now: Date,
  detailed: boolean,
): Promise<WorkspaceResult<RevenueReport>> {
  if (!isRevenueRange(params.range)) {
    return fail(400, "Khoảng thời gian không hợp lệ.");
  }
  const range: RevenueRange = params.range;
  const anchor = normalizeRevenueAnchor(
    range,
    params.anchor,
    now,
    REVENUE_TIME_ZONE,
  );
  if (!anchor) return fail(400, "Mốc thời gian không hợp lệ.");

  const buckets = rangeDayKeys(range, anchor);
  const previousBuckets = previousRangeDayKeys(range, anchor);
  const [current, previous] = await Promise.all([
    listRowsForBuckets(buckets),
    listRowsForBuckets(previousBuckets),
  ]);
  const paidRows = current.rows.filter((row) => row.status === "paid");

  const collected = sumPaid(current.rows);
  const previousCollected = sumPaid(previous.rows);
  const seriesMap = new Map<string, RevenuePoint>(
    seriesBuckets(range, anchor).map((bucket) => [
      bucket.key,
      { key: bucket.key, label: bucket.label, amount: 0, count: 0 },
    ]),
  );
  for (const row of paidRows) {
    if (!(row.paid_at instanceof Date)) continue;
    const key = seriesBucketKey(range, row.paid_at, REVENUE_TIME_ZONE);
    const point = seriesMap.get(key);
    if (!point) continue;
    point.amount += row.amount ?? 0;
    point.count += 1;
  }
  const transactions = paidRows
    .map(toTransaction)
    .filter((t): t is RevenueTransaction => t !== null)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
    .slice(0, 200);

  return {
    ok: true,
    data: {
      range,
      anchor,
      label: rangeLabel(range, anchor),
      timeZone: REVENUE_TIME_ZONE,
      collected,
      receipts: paidRows.length,
      avgReceipt: paidRows.length ? Math.round(collected / paidRows.length) : 0,
      previous: {
        collected: previousCollected,
        delta: collected - previousCollected,
        percent:
          previousCollected > 0
            ? Math.round(
                ((collected - previousCollected) / previousCollected) * 100,
              )
            : null,
      },
      series: [...seriesMap.values()],
      bySource: sliceRows(paidRows, (row) => row.ref_type),
      byMethod: sliceRows(paidRows, (row) => row.method),
      byMechanic: detailed
        ? sliceRows(paidRows, (row) => row.mechanic_id)
        : null,
      flags: detailed ? detectFraudFlags(current.rows) : null,
      transactions,
      truncated: current.truncated,
    },
  };
}

// Dispatcher revenue screen: aggregates + transactions, no mechanic
// breakdown or fraud flags (those stay admin-only).
export async function getDispatchRevenue(
  actor: PublicUser,
  params: RevenueParams,
): Promise<WorkspaceResult<RevenueReport>> {
  if (actor.role !== "dispatcher" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền xem báo cáo doanh thu.");
  }
  return buildReport(params, new Date(), false);
}

// Admin revenue screen: everything the dispatcher sees plus the
// per-mechanic breakdown and the fraud flag list.
export async function getAdminRevenue(
  actor: PublicUser,
  params: RevenueParams,
): Promise<WorkspaceResult<RevenueReport>> {
  if (actor.role !== "admin") {
    return fail(403, "Bạn không có quyền xem báo cáo doanh thu.");
  }
  return buildReport(params, new Date(), true);
}

function toAuditEvent(row: {
  event_id: string;
  event_at: Date | null;
  actor_id: string | null;
  action: string | null;
  ref_type: string | null;
  ref_id: string | null;
  payment_id: string | null;
  amount: number | null;
  method: string | null;
  detail: string | null;
}): PaymentAuditEvent {
  return {
    eventId: row.event_id,
    at: row.event_at ? row.event_at.toISOString() : null,
    actorId: row.actor_id,
    action: row.action,
    refType: row.ref_type,
    refId: row.ref_id,
    paymentId: row.payment_id,
    amount: row.amount,
    method: row.method,
    detail: row.detail,
  };
}

export async function getPaymentAudit(
  actor: PublicUser,
  params: RevenueParams,
): Promise<WorkspaceResult<{ events: PaymentAuditEvent[]; label: string }>> {
  if (actor.role !== "admin") {
    return fail(403, "Bạn không có quyền xem nhật ký thu tiền.");
  }
  if (!isRevenueRange(params.range)) {
    return fail(400, "Khoảng thời gian không hợp lệ.");
  }
  const anchor = normalizeRevenueAnchor(
    params.range,
    params.anchor,
    new Date(),
    REVENUE_TIME_ZONE,
  );
  if (!anchor) return fail(400, "Mốc thời gian không hợp lệ.");

  const buckets = rangeDayKeys(params.range, anchor);
  const events: PaymentAuditEvent[] = [];
  for (let index = 0; index < buckets.length; index += FAN_OUT_CHUNK) {
    const chunk = buckets.slice(index, index + FAN_OUT_CHUNK);
    const results = await Promise.all(
      chunk.map((bucket) => listAuditRows(bucket, BUCKET_ROW_LIMIT)),
    );
    for (const rows of results) {
      events.push(...rows.map(toAuditEvent));
    }
    if (events.length >= AUDIT_ROW_CAP) break;
  }
  events.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return {
    ok: true,
    data: {
      events: events.slice(0, AUDIT_ROW_CAP),
      label: rangeLabel(params.range, anchor),
    },
  };
}
