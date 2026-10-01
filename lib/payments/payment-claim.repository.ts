// Raw CQL for re-owning payments whose booking/order was a guest record
// that just joined an account. The by-id row is the source of truth;
// by-customer and by-period are projections that get the same owner.
import { scylla } from "@/lib/db/client";

export type ClaimPaymentWrite = {
  paymentId: string;
  customerId: string;
  refType: string;
  refId: string;
  amount: number;
  status: string;
  createdAt: Date | null;
  paidAt: Date | null;
  periodBucket: string | null;
};

// One batch per payment: owner on payments_by_id, the missing
// payments_by_customer history row (skipped when created_at is absent —
// it is the clustering key), and the revenue period row when the receipt
// was already settled while the record was still a guest's.
export async function attachPaymentToCustomer(
  write: ClaimPaymentWrite,
): Promise<void> {
  const statements: { query: string; params: unknown[] }[] = [
    {
      query: "UPDATE payments_by_id SET customer_id = ? WHERE payment_id = ?",
      params: [write.customerId, write.paymentId],
    },
  ];

  if (write.createdAt) {
    statements.push({
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
    });
  }

  if (write.periodBucket && write.paidAt) {
    statements.push({
      query:
        "UPDATE payments_by_period SET customer_id = ? WHERE bucket = ? AND paid_at = ? AND payment_id = ?",
      params: [
        write.customerId,
        write.periodBucket,
        write.paidAt,
        write.paymentId,
      ],
    });
  }

  await scylla.batch(statements, { prepare: true });
}
