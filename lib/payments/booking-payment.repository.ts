import { scylla } from "@/lib/db/client";

export type PaymentRow = {
  payment_id: string;
  ref_type: string | null;
  ref_id: string | null;
  customer_id: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  paid_at: Date | null;
  created_at: Date | null;
};

export type PaymentWrite = {
  paymentId: string;
  refType: string;
  refId: string;
  customerId: string;
  amount: number;
  method: string;
  status: string;
  paidAt: Date;
  createdAt: Date;
};

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

function toPaymentRow(raw: RawRow): PaymentRow {
  return {
    payment_id: String(raw.payment_id),
    ref_type: toStringOrNull(raw.ref_type),
    ref_id: toStringOrNull(raw.ref_id),
    customer_id: toStringOrNull(raw.customer_id),
    amount: toNumberOrNull(raw.amount),
    method: toStringOrNull(raw.method),
    status: toStringOrNull(raw.status),
    paid_at: toDateOrNull(raw.paid_at),
    created_at: toDateOrNull(raw.created_at),
  };
}

export async function findPaymentRowById(
  paymentId: string,
): Promise<PaymentRow | null> {
  const result = await scylla.execute(
    "SELECT payment_id, ref_type, ref_id, customer_id, amount, method, status, paid_at, created_at FROM payments_by_id WHERE payment_id = ?",
    [paymentId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toPaymentRow(row) : null;
}

export async function listPaymentRefPaymentIds(
  refType: string,
  refId: string,
): Promise<string[]> {
  const result = await scylla.execute(
    "SELECT ref_type, ref_id, payment_id, amount, status, created_at FROM payments_by_ref WHERE ref_type = ? AND ref_id = ?",
    [refType, refId],
    { prepare: true },
  );
  return (result.rows as unknown as RawRow[])
    .map((row) => (row.payment_id ? String(row.payment_id) : null))
    .filter((id): id is string => id !== null);
}

export async function claimBookingPayment(
  write: PaymentWrite,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO payments_by_id (payment_id, ref_type, ref_id, customer_id, amount, method, status, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS",
    [
      write.paymentId,
      write.refType,
      write.refId,
      write.customerId,
      write.amount,
      write.method,
      write.status,
      write.paidAt,
      write.createdAt,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

export async function projectBookingPayment(
  write: PaymentWrite,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO payments_by_ref (ref_type, ref_id, created_at, payment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)",
        params: [
          write.refType,
          write.refId,
          write.createdAt,
          write.paymentId,
          write.amount,
          write.status,
        ],
      },
      {
        query:
          "INSERT INTO payments_by_customer (customer_id, created_at, payment_id, ref_type, ref_id, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params: [
          write.customerId,
          write.createdAt,
          write.paymentId,
          write.refType,
          write.refId,
          write.amount,
          write.status,
        ],
      },
    ],
    { prepare: true },
  );
}

export async function claimBookingPaymentStatus(
  bookingId: string,
  nextPaymentStatus: string,
  expectedStatus: string,
  expectedPaymentStatus: string,
  updatedAt: Date,
): Promise<boolean> {
  const result = await scylla.execute(
    "UPDATE bookings_by_id SET payment_status = ?, updated_at = ? WHERE booking_id = ? IF status = ? AND payment_status = ?",
    [
      nextPaymentStatus,
      updatedAt,
      bookingId,
      expectedStatus,
      expectedPaymentStatus,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}
