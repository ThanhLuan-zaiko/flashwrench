// Automatic dispatch: offers an unassigned pending booking to the
// nearest eligible mechanic — the same "assign" step a dispatcher runs
// by hand, done by the system instead. Always fails soft: a dispatch
// error must never break the caller that triggered it (booking create,
// a mechanic declining, a mechanic coming online).
import {
  nextTransitionAt,
  transitionBooking,
} from "@/lib/booking/booking-workflow.service";
import {
  isMechanicEligible,
  mechanicScheduleConflict,
} from "@/lib/mechanic/mechanic-assignment.service";
import {
  findBookingRowById,
  listBookingRowsByIds,
  listStatusHistoryRows,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { listAvailableMechanics } from "@/lib/mechanic/mechanic-directory.service";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { listStatusBookingRefs } from "./dispatch.repository";

export const AUTO_DISPATCH_CANDIDATE_LIMIT = 50;
const DECLINE_SCAN_LIMIT = 50;
const SWEEP_BOOKING_LIMIT = 20;

// booking_status_history.changed_by is a UUID column and the scheduler
// has no user account, so its writes carry the nil UUID as the actor.
const SYSTEM_ACTOR_ID = "00000000-0000-0000-0000-000000000000";
const AUTO_DISPATCH_NOTE = "Hệ thống tự điều phối thợ gần nhất.";

export type AutoDispatchOutcome = {
  mechanicId: string;
  mechanicName: string;
};

// Offers go out from `pending`; a dispatcher `confirm` means "verified,
// hand it to the system" — so a confirmed-but-unassigned booking is
// dispatchable too and lands back on `pending` once a mechanic is on it.
const DISPATCHABLE_STATUSES = new Set(["pending", "confirmed"]);
const UNASSIGNED_QUEUE_STATUSES = ["pending", "confirmed"];

// Mechanics who already refused this booking: a decline writes a
// history row landing on `pending` with the mechanic as the actor.
// Dispatcher assigns also land on `pending`, but dispatcher ids never
// appear in the mechanic directory, so folding them in is harmless.
async function declinedMechanicIds(bookingId: string): Promise<Set<string>> {
  const rows = await listStatusHistoryRows(bookingId, DECLINE_SCAN_LIMIT);
  const declined = new Set<string>();
  for (const row of rows) {
    if (row.new_status === "pending" && row.changed_by) {
      declined.add(row.changed_by);
    }
  }
  return declined;
}

// Offers the booking to the nearest eligible mechanic and returns the
// assignment, or null when the booking should stay on the dispatcher
// queue (not pending, already assigned, expired slot, nobody eligible).
export async function autoDispatchBooking(
  bookingId: string,
  options?: { excludeMechanicIds?: Iterable<string> },
): Promise<AutoDispatchOutcome | null> {
  const row = await findBookingRowById(bookingId);
  if (
    !row ||
    !DISPATCHABLE_STATUSES.has(row.status ?? "") ||
    row.mechanic_id !== null
  ) {
    return null;
  }
  // An offer for a slot that already passed is unworkable — leave it to
  // the dispatcher to reschedule or cancel.
  if (row.scheduled_at && row.scheduled_at.getTime() < Date.now()) {
    return null;
  }

  const excluded = await declinedMechanicIds(bookingId);
  for (const id of options?.excludeMechanicIds ?? []) excluded.add(id);

  const origin =
    typeof row.address?.lat === "number" && typeof row.address?.lng === "number"
      ? { lat: row.address.lat, lng: row.address.lng }
      : {};
  const candidates = await listAvailableMechanics({
    ...origin,
    limit: AUTO_DISPATCH_CANDIDATE_LIMIT,
  });
  if (!candidates.ok) return null;

  // Nearest-first when the booking carries a pin, rating order
  // otherwise — the same ordering the customer picker shows.
  const scheduledAt = row.scheduled_at ?? new Date();
  for (const candidate of candidates.data) {
    if (excluded.has(candidate.id)) continue;
    if (!(await isMechanicEligible(candidate.id))) continue;
    const conflict = await mechanicScheduleConflict(
      candidate.id,
      scheduledAt,
      bookingId,
    );
    if (conflict !== false) continue;

    const transition = await transitionBooking({
      before: row,
      status: "pending",
      mechanicId: candidate.id,
      mechanicName: candidate.displayName,
      actorId: SYSTEM_ACTOR_ID,
      note: AUTO_DISPATCH_NOTE,
      at: nextTransitionAt(row),
    });
    // Lost the optimistic claim: a dispatcher or another dispatch pass
    // just touched the booking — leave it alone rather than fight.
    if (!transition.ok) return null;
    await publishBookingChange(
      "booking-assigned",
      bookingId,
      "pending",
      row.customer_id,
      [row.mechanic_id, candidate.id],
    );
    return { mechanicId: candidate.id, mechanicName: candidate.displayName };
  }
  return null;
}

// Pending bookings never claimed sit invisible until a dispatcher picks
// them up. The sweep re-offers them when new capacity appears — called
// once per offline→online flip. Buckets are keyed by the schedule's
// wall-month, so the scan covers the previous, current and next month.
function monthKeysAround(now: Date): string[] {
  const keys = new Set<string>();
  for (const delta of [-1, 0, 1]) {
    // A mid-month anchor avoids boundary drift when shifting months.
    const anchor = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + delta, 15),
    );
    keys.add(monthKey(anchor, MECHANIC_TIME_ZONE));
  }
  return [...keys];
}

// A declined offer returns the booking to the unassigned pool: re-offer
// it to the next nearest mechanic, keeping the mechanic who just
// refused out of the candidate set. Dispatch failure never rolls the
// decline back.
export async function redispatchAfterDecline(
  bookingId: string,
  declinedBy: string,
): Promise<void> {
  try {
    await autoDispatchBooking(bookingId, {
      excludeMechanicIds: [declinedBy],
    });
  } catch {
    // Best-effort: the dispatcher queue still shows the booking.
  }
}

export async function redispatchUnassignedBookings(
  limit = SWEEP_BOOKING_LIMIT,
): Promise<number> {
  const pages = await Promise.all(
    monthKeysAround(new Date()).flatMap((month) =>
      UNASSIGNED_QUEUE_STATUSES.map((status) =>
        listStatusBookingRefs(status, month, limit),
      ),
    ),
  );
  const seen = new Set<string>();
  const bookingIds = pages
    .flatMap((page) => page.rows)
    .map((ref) => ref.booking_id)
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  if (bookingIds.length === 0) return 0;

  const rows = await listBookingRowsByIds(bookingIds);
  let assigned = 0;
  for (const row of rows) {
    if (assigned >= limit) break;
    if (
      !DISPATCHABLE_STATUSES.has(row.status ?? "") ||
      row.mechanic_id !== null
    ) {
      continue;
    }
    const outcome = await autoDispatchBooking(row.booking_id);
    if (outcome) assigned += 1;
  }
  return assigned;
}
