import { scylla } from "@/lib/db/client";
import type { MechanicReviewRow } from "@/lib/mechanic/mechanic.types";
import type { MetricPage, MetricReceipt } from "./metrics.types";

type RawRow = Record<string, unknown>;

function text(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function number(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function date(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export async function metricPaymentRefs(
  bookingId: string,
  pageState: string | null,
): Promise<MetricPage<string>> {
  const result = await scylla.execute(
    "SELECT payment_id FROM payments_by_ref WHERE ref_type = ? AND ref_id = ?",
    ["booking", bookingId],
    { prepare: true, fetchSize: 100, pageState: pageState ?? undefined },
  );
  return {
    rows: result.rows.map((row) => String(row.payment_id)),
    pageState: result.pageState ?? null,
  };
}

export async function metricReceiptById(
  paymentId: string,
): Promise<MetricReceipt | null> {
  const result = await scylla.execute(
    "SELECT payment_id, ref_type, ref_id, customer_id, amount, status, method, paid_at, created_at FROM payments_by_id WHERE payment_id = ?",
    [paymentId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  if (!row) return null;
  return {
    payment_id: String(row.payment_id),
    ref_type: text(row.ref_type) ?? "",
    ref_id: text(row.ref_id) ?? "",
    customer_id: text(row.customer_id),
    amount: number(row.amount),
    status: text(row.status),
    method: text(row.method),
    paid_at: date(row.paid_at),
    created_at: date(row.created_at),
  };
}

export async function metricHistoryPage(
  bookingId: string,
  pageState: string | null,
): Promise<MetricPage<{ status: string | null; at: Date | null }>> {
  const result = await scylla.execute(
    "SELECT new_status, changed_at FROM booking_status_history WHERE booking_id = ?",
    [bookingId],
    { prepare: true, fetchSize: 100, pageState: pageState ?? undefined },
  );
  return {
    rows: result.rows.map((row) => ({
      status: text(row.new_status),
      at: date(row.changed_at),
    })),
    pageState: result.pageState ?? null,
  };
}

export async function metricReviewPage(
  mechanicId: string,
  pageState: string | null,
): Promise<MetricPage<MechanicReviewRow>> {
  const result = await scylla.execute(
    "SELECT target_type, target_id, review_id, customer_name, booking_id, rating, title, body, created_at FROM reviews_by_target WHERE target_type = ? AND target_id = ?",
    ["mechanic", mechanicId],
    { prepare: true, fetchSize: 100, pageState: pageState ?? undefined },
  );
  return {
    rows: result.rows.map((row) => ({
      target_type: String(row.target_type),
      target_id: String(row.target_id),
      review_id: String(row.review_id),
      customer_name: text(row.customer_name),
      booking_id: text(row.booking_id),
      rating: number(row.rating),
      title: text(row.title),
      body: text(row.body),
      created_at: date(row.created_at),
    })),
    pageState: result.pageState ?? null,
  };
}
