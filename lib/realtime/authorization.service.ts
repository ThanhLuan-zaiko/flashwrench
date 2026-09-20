import { authenticate } from "@/lib/auth/auth.service";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import {
  bookingIdFromTopic,
  canSubscribe,
  type RealtimeUser,
} from "./protocol";

export async function realtimeUser(
  token: string | null,
): Promise<RealtimeUser | null> {
  if (!token) return null;
  const user = await authenticate(token);
  return user ? { id: user.id, role: user.role } : null;
}

export async function authorizeTopic(
  user: RealtimeUser | null,
  topic: string,
): Promise<boolean> {
  if (!canSubscribe(user, topic)) return false;
  const bookingId = bookingIdFromTopic(topic);
  if (!bookingId) return true;
  if (!user) return false;
  const booking = await findBookingRowById(bookingId);
  return Boolean(
    booking &&
      (user.role === "admin" ||
        user.role === "dispatcher" ||
        booking.customer_id === user.id ||
        booking.mechanic_id === user.id),
  );
}
