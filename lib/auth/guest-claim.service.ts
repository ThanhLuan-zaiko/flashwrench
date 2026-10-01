// Guest-record handoff: register and login both prove control of the
// contact pair, so guest bookings/orders filed under the same phone+email
// join the account (history + payments_by_customer included). Runs inside
// auth — never awaited by callers in a way that can fail authentication;
// each domain swallows its own errors and stale refs retry next sign-in.
import { claimGuestBookings } from "@/lib/booking/booking-claim.service";
import { claimGuestOrders } from "@/lib/orders/order-claim.service";
import type { PublicUser } from "./user.types";
import { normalizeEmail, normalizePhone } from "./validation";

export async function claimGuestRecords(user: PublicUser): Promise<void> {
  const phone = normalizePhone(user.phone);
  const email = normalizeEmail(user.email);
  if (!phone || !email) return;
  await claimGuestBookings({ userId: user.id, phone, email }).catch(() => 0);
  await claimGuestOrders({ userId: user.id, phone, email }).catch(() => 0);
}
