// Raw CQL for absorbing guest bookings into a fresh account. No business
// logic here: the claim service reads the booking row, decides the match
// and passes everything this batch needs.
import { scylla } from "@/lib/db/client";

export type GuestBookingRefRow = {
  booking_id: string;
  email: string | null;
};

// Phone partitions stay tiny (a handful of bookings per contact), so a
// full-partition read is the whole lookup — no paging needed.
export async function listGuestBookingRefsByPhone(
  phone: string,
): Promise<GuestBookingRefRow[]> {
  const result = await scylla.execute(
    "SELECT booking_id, email FROM guest_bookings_by_phone WHERE phone = ?",
    [phone],
    { prepare: true },
  );
  return (result.rows as unknown as Record<string, unknown>[]).map((row) => ({
    booking_id: String(row.booking_id),
    email: (row.email as string | null) ?? null,
  }));
}

export type ClaimGuestBookingWrite = {
  bookingId: string;
  customerId: string;
  scheduledAt: Date | null;
  status: string | null;
  total: number | null;
  vehiclePlate: string | null;
  mechanicName: string | null;
  monthBucket: string | null;
  at: Date;
};

// One batch teaches every denormalized copy the new owner: the booking
// row itself, the customer history partition, and the dispatcher status
// bucket (customer_id is a plain column there). Rows missing a clustering
// piece (scheduled_at is effectively always set, but stay defensive) just
// skip that copy — the by_id owner change is never skipped.
export async function claimGuestBooking(
  write: ClaimGuestBookingWrite,
): Promise<void> {
  const queries: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE bookings_by_id SET customer_id = ?, updated_at = ? WHERE booking_id = ?",
      params: [write.customerId, write.at, write.bookingId],
    },
  ];

  if (write.scheduledAt) {
    queries.push({
      query:
        "INSERT INTO bookings_by_customer (customer_id, scheduled_at, booking_id, status, total, vehicle_plate, mechanic_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
      params: [
        write.customerId,
        write.scheduledAt,
        write.bookingId,
        write.status,
        write.total,
        write.vehiclePlate,
        write.mechanicName,
      ],
    });
  }

  if (write.status && write.monthBucket && write.scheduledAt) {
    queries.push({
      query:
        "UPDATE bookings_by_status SET customer_id = ? WHERE status = ? AND month_bucket = ? AND scheduled_at = ? AND booking_id = ?",
      params: [
        write.customerId,
        write.status,
        write.monthBucket,
        write.scheduledAt,
        write.bookingId,
      ],
    });
  }

  await scylla.batch(queries, { prepare: true });
}

// Claimed (or dead) refs only waste future lookups — remove them. Missing
// rows are fine: DELETE is idempotent.
export async function deleteGuestBookingRef(
  phone: string,
  bookingId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM guest_bookings_by_phone WHERE phone = ? AND booking_id = ?",
    [phone, bookingId],
    { prepare: true },
  );
}
