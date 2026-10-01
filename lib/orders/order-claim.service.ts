// Absorb guest orders into an account — mirrors booking-claim.service on
// the orders tables. Same contact-pair match (phone partition + stored
// email), same best-effort semantics per row.

import { deleteGuestRecordRef } from "@/lib/guest-access/guest-access.repository";
import { attachRefPaymentsToCustomer } from "@/lib/payments/payment-claim.service";
import {
  claimGuestOrder,
  deleteGuestOrderRef,
  listGuestOrderRefsByPhone,
} from "./guest-claim.repository";
import { findOrderRowById } from "./orders.repository";

export async function claimGuestOrders(params: {
  userId: string;
  phone: string;
  email: string;
}): Promise<number> {
  const refs = await listGuestOrderRefsByPhone(params.phone);
  let claimed = 0;
  for (const ref of refs) {
    try {
      if (ref.email !== params.email) continue;
      const row = await findOrderRowById(ref.order_id);
      if (!row || row.customer_id !== null) {
        await deleteGuestOrderRef(params.phone, ref.order_id);
        continue;
      }
      await claimGuestOrder({
        orderId: ref.order_id,
        customerId: params.userId,
        createdAt: row.created_at,
        status: row.status,
        total: row.total,
        monthBucket: row.month_bucket,
        at: new Date(),
      });
      await attachRefPaymentsToCustomer("order", ref.order_id, params.userId);
      await deleteGuestOrderRef(params.phone, ref.order_id);
      // Drop the email-keyed twin so the lookup partition does not grow with
      // every order the person ever filed anonymously.
      await deleteGuestRecordRef(params.email, ref.order_id).catch(
        () => undefined,
      );
      claimed += 1;
    } catch {
      // Keep claiming the remaining refs; this one retries next sign-in.
    }
  }
  return claimed;
}
