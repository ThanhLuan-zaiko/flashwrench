import { types } from "cassandra-driver";
import { scylla } from "@/lib/db/client";
import type { BookingWorkflowWrite } from "./booking-workflow.types";

export type ResolvedWorkflowWrite = BookingWorkflowWrite & {
  monthBucket: string;
};

export async function claimBookingTransition(
  write: ResolvedWorkflowWrite,
): Promise<boolean> {
  const result = await scylla.execute(
    "UPDATE bookings_by_id SET status = ?, mechanic_id = ?, mechanic_name = ?, cancel_reason = ?, updated_at = ? WHERE booking_id = ? IF status = ? AND mechanic_id = ? AND updated_at = ?",
    [
      write.status,
      write.mechanicId,
      write.mechanicName,
      write.status === "cancelled" ? write.note : write.before.cancel_reason,
      write.at,
      write.before.booking_id,
      write.before.status,
      write.before.mechanic_id,
      write.before.updated_at,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

// One batch keeps every denormalized copy of the status in sync: the
// booking row, the mechanic workload row, the dispatcher status bucket and
// the tracking timeline. The status bucket is clustered by scheduled_at, so
// a booking without a schedule can only move between buckets.
export async function projectBookingTransition(
  write: ResolvedWorkflowWrite,
): Promise<void> {
  const { before } = write;
  const scheduledAt = before.scheduled_at ?? write.at;
  const queries: { query: string; params: unknown[] }[] = [];

  if (before.customer_id && before.scheduled_at) {
    queries.push({
      query:
        "INSERT INTO bookings_by_customer (customer_id, scheduled_at, booking_id, status, total, vehicle_plate, mechanic_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params: [
        before.customer_id,
        before.scheduled_at,
        before.booking_id,
        write.status,
        before.total,
        before.vehicle_plate,
        write.mechanicName,
      ],
    });
  }

  queries.push({
    query:
      "INSERT INTO bookings_by_status (status, month_bucket, scheduled_at, booking_id, customer_id, mechanic_id, zone_id, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    params: [
      write.status,
      write.monthBucket,
      scheduledAt,
      before.booking_id,
      before.customer_id,
      write.mechanicId,
      before.zone_id,
      before.total,
    ],
  });

  if (write.mechanicId && before.scheduled_at) {
    queries.push({
      query:
        "INSERT INTO bookings_by_mechanic (mechanic_id, scheduled_at, booking_id, status, total, vehicle_plate, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params: [
        write.mechanicId,
        before.scheduled_at,
        before.booking_id,
        write.status,
        before.total,
        before.vehicle_plate,
        before.customer_name,
      ],
    });
  }

  if (
    before.mechanic_id &&
    before.mechanic_id !== write.mechanicId &&
    before.scheduled_at
  ) {
    queries.push({
      query:
        "DELETE FROM bookings_by_mechanic WHERE mechanic_id = ? AND scheduled_at = ? AND booking_id = ?",
      params: [before.mechanic_id, before.scheduled_at, before.booking_id],
    });
  }

  if (before.status !== write.status && before.scheduled_at) {
    queries.push({
      query:
        "DELETE FROM bookings_by_status WHERE status = ? AND month_bucket = ? AND scheduled_at = ? AND booking_id = ?",
      params: [
        before.status,
        before.month_bucket ?? write.monthBucket,
        before.scheduled_at,
        before.booking_id,
      ],
    });
  }

  queries.push({
    query:
      "INSERT INTO booking_status_history (booking_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
    params: [
      before.booking_id,
      write.at,
      before.status,
      write.status,
      write.actorId,
      write.note,
    ],
  });

  await scylla.batch(queries, {
    prepare: true,
    timestamp: types.Long.fromNumber(write.at.getTime() * 1000),
  });
}
