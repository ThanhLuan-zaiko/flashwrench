// Raw CQL for rescue payment writes. Split from rescue-workflow.repository
// so each file stays under the size limit.
import { scylla } from "@/lib/db/client";

// Cash collection settle: flips payment_status unpaid -> paid and stamps
// the final price, guarded by CAS so a double-tap or a second collector
// loses instead of overwriting.
export async function claimRescuePaymentStatus(
  requestId: string,
  finalPrice: number,
  expectedPaymentStatus: string,
  updatedAt: Date,
): Promise<boolean> {
  const result = await scylla.execute(
    "UPDATE emergency_by_id SET payment_status = 'paid', final_price = ?, updated_at = ? WHERE request_id = ? IF status = 'completed' AND payment_status = ?",
    [finalPrice, updatedAt, requestId, expectedPaymentStatus],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

// Rotate the customer-facing rescue cash confirmation code.
export async function setRescuePaymentCode(
  requestId: string,
  code: string | null,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE emergency_by_id SET payment_confirm_code = ?, updated_at = ? WHERE request_id = ?",
    [code, updatedAt, requestId],
    { prepare: true },
  );
}
