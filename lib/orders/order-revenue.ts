// Order payment -> revenue projection. Orders write their payments_by_id
// row at checkout with status pending, so the revenue period/audit rows
// only appear when the money is actually confirmed (counter collection,
// mock online settle, delivered COD). Refunds flip the period row so the
// sale stops counting.
import { findPaymentRowById } from "@/lib/payments/booking-payment.repository";
import {
  markReceiptRefunded,
  projectReceipt,
} from "@/lib/revenue/revenue.service";
import { listOrderPaymentRefs } from "./orders-delivery.repository";

/** Write period + audit rows for every paid receipt of this order. */
export async function projectOrderReceipts(
  orderId: string,
  recordedBy: string | null,
  paidAt: Date,
): Promise<void> {
  const refs = await listOrderPaymentRefs(orderId);
  for (const ref of refs) {
    const row = await findPaymentRowById(ref.paymentId);
    if (row?.status !== "paid" || !(row.paid_at instanceof Date)) {
      continue;
    }
    await projectReceipt({
      paymentId: row.payment_id,
      refType: "order",
      refId: orderId,
      customerId: row.customer_id,
      mechanicId: null,
      recordedBy: row.recorded_by ?? recordedBy,
      customerConfirmed: row.customer_confirmed,
      amount: row.amount ?? 0,
      method: row.method ?? "counter",
      paidAt: row.paid_at ?? paidAt,
    });
  }
}

/** Mark every projected order receipt refunded so revenue drops it. */
export async function refundOrderReceipts(
  orderId: string,
  actorId: string | null,
): Promise<void> {
  const refs = await listOrderPaymentRefs(orderId);
  for (const ref of refs) {
    await markReceiptRefunded(ref.paymentId, actorId);
  }
}
