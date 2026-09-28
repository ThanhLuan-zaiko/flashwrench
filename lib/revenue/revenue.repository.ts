// Raw CQL for the revenue read/write models: payments_by_period (report
// source of truth) and payment_audit_by_day (admin audit feed). No
// business logic here — services own every rule and decision.
import { scylla } from "@/lib/db/client";
import type {
  AuditEventWrite,
  PaymentAuditRow,
  PeriodPaymentRow,
  ReceiptProjectionWrite,
} from "./revenue.types";

const PERIOD_COLUMNS =
  "bucket, paid_at, payment_id, ref_type, ref_id, customer_id, mechanic_id, amount, method, status, recorded_by, customer_confirmed";

const AUDIT_COLUMNS =
  "bucket, event_at, event_id, actor_id, action, ref_type, ref_id, payment_id, amount, method, detail";

type RawRow = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPeriodRow(raw: RawRow): PeriodPaymentRow {
  return {
    bucket: toStringOrNull(raw.bucket) ?? "",
    paid_at: toDateOrNull(raw.paid_at),
    payment_id: String(raw.payment_id),
    ref_type: toStringOrNull(raw.ref_type),
    ref_id: toStringOrNull(raw.ref_id),
    customer_id: toStringOrNull(raw.customer_id),
    mechanic_id: toStringOrNull(raw.mechanic_id),
    amount: toNumberOrNull(raw.amount),
    method: toStringOrNull(raw.method),
    status: toStringOrNull(raw.status),
    recorded_by: toStringOrNull(raw.recorded_by),
    customer_confirmed:
      typeof raw.customer_confirmed === "boolean"
        ? raw.customer_confirmed
        : null,
  };
}

function toAuditRow(raw: RawRow): PaymentAuditRow {
  return {
    bucket: toStringOrNull(raw.bucket) ?? "",
    event_at: toDateOrNull(raw.event_at),
    event_id: String(raw.event_id),
    actor_id: toStringOrNull(raw.actor_id),
    action: toStringOrNull(raw.action),
    ref_type: toStringOrNull(raw.ref_type),
    ref_id: toStringOrNull(raw.ref_id),
    payment_id: toStringOrNull(raw.payment_id),
    amount: toNumberOrNull(raw.amount),
    method: toStringOrNull(raw.method),
    detail: toStringOrNull(raw.detail),
  };
}

// Upsert by primary key: replays of the same receipt overwrite identical
// fields, so the projection stays idempotent like every other write model.
export async function insertPeriodRow(
  write: ReceiptProjectionWrite & { bucket: string },
): Promise<void> {
  await scylla.execute(
    `INSERT INTO payments_by_period (${PERIOD_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      write.bucket,
      write.paidAt,
      write.paymentId,
      write.refType,
      write.refId,
      write.customerId,
      write.mechanicId,
      write.amount,
      write.method,
      "paid",
      write.recordedBy,
      write.customerConfirmed,
    ],
    { prepare: true },
  );
}

// A receipt that later turns refunded must stop counting as revenue; the
// row stays for the audit trail with its new status.
export async function updatePeriodRowStatus(
  bucket: string,
  paidAt: Date,
  paymentId: string,
  status: string,
): Promise<void> {
  await scylla.execute(
    "UPDATE payments_by_period SET status = ? WHERE bucket = ? AND paid_at = ? AND payment_id = ?",
    [status, bucket, paidAt, paymentId],
    { prepare: true },
  );
}

export async function insertAuditEvent(
  write: AuditEventWrite & { bucket: string },
): Promise<void> {
  await scylla.execute(
    `INSERT INTO payment_audit_by_day (${AUDIT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      write.bucket,
      write.at,
      write.eventId,
      write.actorId,
      write.action,
      write.refType,
      write.refId,
      write.paymentId,
      write.amount,
      write.method,
      write.detail,
    ],
    { prepare: true },
  );
}

/** One day partition, newest receipts first, hard-capped per partition. */
export async function listPeriodRows(
  bucket: string,
  limit: number,
): Promise<PeriodPaymentRow[]> {
  const result = await scylla.execute(
    `SELECT ${PERIOD_COLUMNS} FROM payments_by_period WHERE bucket = ? LIMIT ?`,
    [bucket, limit],
    { prepare: true },
  );
  return (result.rows as unknown as RawRow[]).map(toPeriodRow);
}

export async function listAuditRows(
  bucket: string,
  limit: number,
): Promise<PaymentAuditRow[]> {
  const result = await scylla.execute(
    `SELECT ${AUDIT_COLUMNS} FROM payment_audit_by_day WHERE bucket = ? LIMIT ?`,
    [bucket, limit],
    { prepare: true },
  );
  return (result.rows as unknown as RawRow[]).map(toAuditRow);
}
