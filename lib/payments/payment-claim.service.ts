// Re-own payments after a guest record joins an account: every receipt
// the guest already paid gains the same customer_id so the account
// history (payments_by_customer) and revenue projection stop missing it.
import { dayKey } from "@/lib/mechanic/mechanic-period";
import { REVENUE_TIME_ZONE } from "@/lib/revenue/revenue-period";
import {
  findPaymentRowById,
  listPaymentRefPaymentIds,
} from "./booking-payment.repository";
import { attachPaymentToCustomer } from "./payment-claim.repository";

export async function attachRefPaymentsToCustomer(
  refType: "booking" | "order",
  refId: string,
  customerId: string,
): Promise<void> {
  const paymentIds = await listPaymentRefPaymentIds(refType, refId);
  for (const paymentId of paymentIds) {
    const row = await findPaymentRowById(paymentId);
    // Never steal a receipt: only rows still owned by nobody move. An
    // already-owned payment means the claim replayed — skip it.
    if (!row || row.customer_id !== null) continue;
    await attachPaymentToCustomer({
      paymentId,
      customerId,
      refType: row.ref_type ?? refType,
      refId: row.ref_id ?? refId,
      amount: row.amount ?? 0,
      status: row.status ?? "paid",
      createdAt: row.created_at,
      paidAt: row.paid_at,
      periodBucket: row.paid_at ? dayKey(row.paid_at, REVENUE_TIME_ZONE) : null,
    });
  }
}
