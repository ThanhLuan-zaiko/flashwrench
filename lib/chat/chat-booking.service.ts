// Booking context for a chat thread. Threads are per (customer,
// mechanic) pair while bookings are per job, so one thread can cover
// several jobs. This service resolves the latest shared bookings by
// reading the customer's partition then fanning out to point lookups,
// the same pattern as listCustomerBookings. No new CQL tables.
import { listCustomerBookingRefs } from "@/lib/booking/customer-bookings.repository";
import { listBookingRowsByIds } from "@/lib/mechanic/mechanic-bookings.repository";
import { findThreadRowById } from "./chat.repository";
import type { ChatResult } from "./chat.types";
import {
  type ChatActor,
  chatFail,
  isMembership,
  requireChatMember,
} from "./chat-access";
import {
  type ChatBookingContext,
  sortBookingContexts,
  toChatBookingContext,
} from "./chat-booking.types";

const MAX_REFS = 20;
const MAX_ITEMS = 3;

export async function getThreadBookings(
  actor: ChatActor,
  threadId: string,
): Promise<ChatResult<ChatBookingContext[]>> {
  const member = await requireChatMember(actor, threadId);
  if (!isMembership(member)) return member;
  const thread = await findThreadRowById(threadId);
  if (!thread?.customer_id || !thread?.mechanic_id) {
    return chatFail(404, "Không tìm thấy cuộc trò chuyện.");
  }
  const refs = await listCustomerBookingRefs(thread.customer_id, MAX_REFS);
  if (refs.rows.length === 0) return { ok: true, data: [] };
  const rows = await listBookingRowsByIds(
    refs.rows.map((row) => row.booking_id),
  );
  const shared = rows.filter(
    (row) =>
      row.mechanic_id === thread.mechanic_id &&
      row.customer_id === thread.customer_id,
  );
  const items = sortBookingContexts(shared.map(toChatBookingContext)).slice(
    0,
    MAX_ITEMS,
  );
  return { ok: true, data: items };
}
