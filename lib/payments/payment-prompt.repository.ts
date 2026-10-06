// Raw CQL for payment_prompts_by_customer — the per-customer index the
// payment banner reads. No business logic here; callers decide what a
// prompt means.
import { scylla } from "@/lib/db/client";
import type { PaymentPromptRow } from "./payment-prompt.types";

type RawRow = Record<string, unknown>;

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

function toPromptRow(raw: RawRow): PaymentPromptRow {
  return {
    customer_id: String(raw.customer_id),
    ref_type: String(raw.ref_type),
    ref_id: String(raw.ref_id),
    title: (raw.title as string | null) ?? null,
    amount_due: toNumberOrNull(raw.amount_due),
    issued_at: toDateOrNull(raw.issued_at),
  };
}

export async function putPaymentPrompt(input: {
  customerId: string;
  refType: string;
  refId: string;
  title: string;
  amountDue: number;
  issuedAt: Date;
}): Promise<void> {
  await scylla.execute(
    "INSERT INTO payment_prompts_by_customer (customer_id, ref_type, ref_id, title, amount_due, issued_at) VALUES (?, ?, ?, ?, ?, ?)",
    [
      input.customerId,
      input.refType,
      input.refId,
      input.title,
      input.amountDue,
      input.issuedAt,
    ],
    { prepare: true },
  );
}

// Plain DELETE: clearing a prompt that was never written is a no-op, so
// every settle path can call this unconditionally.
export async function deletePaymentPrompt(
  customerId: string,
  refType: string,
  refId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM payment_prompts_by_customer WHERE customer_id = ? AND ref_type = ? AND ref_id = ?",
    [customerId, refType, refId],
    { prepare: true },
  );
}

export async function listPaymentPromptRows(
  customerId: string,
): Promise<PaymentPromptRow[]> {
  const result = await scylla.execute(
    "SELECT customer_id, ref_type, ref_id, title, amount_due, issued_at FROM payment_prompts_by_customer WHERE customer_id = ?",
    [customerId],
    { prepare: true },
  );
  return (result.rows as unknown as RawRow[]).map(toPromptRow);
}
