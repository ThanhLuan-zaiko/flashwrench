// Absorb guest bookings into an account once a sign-in proves control of
// the contact pair (same normalized phone AND email). Lookup rows come
// from guest_bookings_by_phone; each ref re-reads the booking so stale or
// already-claimed rows clean themselves up instead of double-writing.
// Best-effort per row: a failure leaves the ref in place so the next
// sign-in retries it.

import { deleteGuestRecordRef } from "@/lib/guest-access/guest-access.repository";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { attachRefPaymentsToCustomer } from "@/lib/payments/payment-claim.service";
import {
  claimGuestBooking,
  deleteGuestBookingRef,
  listGuestBookingRefsByPhone,
} from "./guest-claim.repository";

export async function claimGuestBookings(params: {
  userId: string;
  phone: string;
  email: string;
}): Promise<number> {
  const refs = await listGuestBookingRefsByPhone(params.phone);
  let claimed = 0;
  for (const ref of refs) {
    try {
      // Same phone shared between people must not leak bookings: the
      // stored email has to match the account too.
      if (ref.email !== params.email) continue;
      const row = await findBookingRowById(ref.booking_id);
      if (!row || row.customer_id !== null) {
        await deleteGuestBookingRef(params.phone, ref.booking_id);
        continue;
      }
      await claimGuestBooking({
        bookingId: ref.booking_id,
        customerId: params.userId,
        scheduledAt: row.scheduled_at,
        status: row.status,
        total: row.total,
        vehiclePlate: row.vehicle_plate,
        mechanicName: row.mechanic_name,
        monthBucket: row.month_bucket,
        at: new Date(),
      });
      await attachRefPaymentsToCustomer(
        "booking",
        ref.booking_id,
        params.userId,
      );
      await deleteGuestBookingRef(params.phone, ref.booking_id);
      // Drop the email-keyed twin too. The reader already skips claimed
      // records, but leaving the row would grow the address partition for
      // every booking the person ever filed anonymously.
      await deleteGuestRecordRef(params.email, ref.booking_id).catch(
        () => undefined,
      );
      claimed += 1;
    } catch {
      // Keep claiming the remaining refs; this one retries next sign-in.
    }
  }
  return claimed;
}
