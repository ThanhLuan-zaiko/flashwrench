// Raw CQL for at-home repair bookings read and written by a mechanic.
// No business logic here: services own every rule and decision.
import { scylla } from "@/lib/db/client";
import type {
  MechanicAddressUdt,
  MechanicBookingItemRow,
  MechanicBookingRow,
  MechanicStatusHistoryRow,
  MechanicWorkloadRow,
} from "./mechanic.types";

const WORKLOAD_COLUMNS =
  "mechanic_id, scheduled_at, booking_id, status, total, vehicle_plate, customer_name";

const BOOKING_COLUMNS =
  "booking_id, customer_id, customer_name, customer_phone, vehicle_plate, vehicle_brand, vehicle_model, mechanic_id, zone_id, address, scheduled_at, status, payment_status, total, notes, cancel_reason, created_at, updated_at";

type RawRow = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

// address is a FROZEN<address_udt>; the driver returns it as a plain object.
function toAddress(value: unknown): MechanicAddressUdt | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as RawRow;
  return {
    full_text: toStringOrNull(raw.full_text),
    lat: toNumberOrNull(raw.lat),
    lng: toNumberOrNull(raw.lng),
  };
}

function toWorkloadRow(raw: RawRow): MechanicWorkloadRow {
  return {
    mechanic_id: String(raw.mechanic_id),
    scheduled_at: toDateOrNull(raw.scheduled_at),
    booking_id: String(raw.booking_id),
    status: toStringOrNull(raw.status),
    total: toNumberOrNull(raw.total),
    vehicle_plate: toStringOrNull(raw.vehicle_plate),
    customer_name: toStringOrNull(raw.customer_name),
  };
}

function toBookingRow(raw: RawRow): MechanicBookingRow {
  return {
    booking_id: String(raw.booking_id),
    customer_id: toStringOrNull(raw.customer_id),
    customer_name: toStringOrNull(raw.customer_name),
    customer_phone: toStringOrNull(raw.customer_phone),
    vehicle_plate: toStringOrNull(raw.vehicle_plate),
    vehicle_brand: toStringOrNull(raw.vehicle_brand),
    vehicle_model: toStringOrNull(raw.vehicle_model),
    mechanic_id: toStringOrNull(raw.mechanic_id),
    zone_id: toStringOrNull(raw.zone_id),
    address: toAddress(raw.address),
    scheduled_at: toDateOrNull(raw.scheduled_at),
    status: toStringOrNull(raw.status),
    payment_status: toStringOrNull(raw.payment_status),
    total: toNumberOrNull(raw.total),
    notes: toStringOrNull(raw.notes),
    cancel_reason: toStringOrNull(raw.cancel_reason),
    created_at: toDateOrNull(raw.created_at),
    updated_at: toDateOrNull(raw.updated_at),
  };
}

function toItemRow(raw: RawRow): MechanicBookingItemRow {
  return {
    booking_id: String(raw.booking_id),
    service_id: String(raw.service_id),
    service_name: toStringOrNull(raw.service_name),
    quantity: toNumberOrNull(raw.quantity),
    unit_price: toNumberOrNull(raw.unit_price),
    line_total: toNumberOrNull(raw.line_total),
  };
}

function toHistoryRow(raw: RawRow): MechanicStatusHistoryRow {
  return {
    changed_at: toDateOrNull(raw.changed_at),
    old_status: toStringOrNull(raw.old_status),
    new_status: toStringOrNull(raw.new_status),
    changed_by: toStringOrNull(raw.changed_by),
    note: toStringOrNull(raw.note),
  };
}

async function selectRows(query: string, params: unknown[]): Promise<RawRow[]> {
  const result = await scylla.execute(query, params, { prepare: true });
  return result.rows as unknown as RawRow[];
}

async function selectFirst(
  query: string,
  params: unknown[],
): Promise<RawRow | null> {
  const result = await scylla.execute(query, params, { prepare: true });
  const row = result.first() as unknown as RawRow | null;
  return row ?? null;
}
/** Query: mechanic workload, newest schedule first (one partition read). */
export async function listWorkloadRows(
  mechanicId: string,
  limit: number,
): Promise<MechanicWorkloadRow[]> {
  const rows = await selectRows(
    `SELECT ${WORKLOAD_COLUMNS} FROM bookings_by_mechanic WHERE mechanic_id = ? LIMIT ?`,
    [mechanicId, limit],
  );
  return rows.map(toWorkloadRow);
}

export async function findBookingRowById(
  bookingId: string,
): Promise<MechanicBookingRow | null> {
  const row = await selectFirst(
    `SELECT ${BOOKING_COLUMNS} FROM bookings_by_id WHERE booking_id = ?`,
    [bookingId],
  );
  return row ? toBookingRow(row) : null;
}

// Fan-out read of single-partition lookups. CQL forbids SELECT inside a
// BATCH statement, so the rows are fetched concurrently instead. Callers
// pass the booking ids of one page only.
export async function listBookingRowsByIds(
  bookingIds: string[],
): Promise<MechanicBookingRow[]> {
  if (bookingIds.length === 0) return [];
  const results = await Promise.all(
    bookingIds.map((bookingId) =>
      selectFirst(
        `SELECT ${BOOKING_COLUMNS} FROM bookings_by_id WHERE booking_id = ?`,
        [bookingId],
      ),
    ),
  );
  return results.filter((row): row is RawRow => row !== null).map(toBookingRow);
}

export async function listBookingItemRowsByBookingIds(
  bookingIds: string[],
): Promise<MechanicBookingItemRow[]> {
  if (bookingIds.length === 0) return [];
  const results = await Promise.all(
    bookingIds.map((bookingId) =>
      selectRows(
        "SELECT booking_id, service_id, service_name, quantity, unit_price, line_total FROM booking_items WHERE booking_id = ?",
        [bookingId],
      ),
    ),
  );
  return results.flat().map(toItemRow);
}

export async function listStatusHistoryRows(
  bookingId: string,
  limit: number,
): Promise<MechanicStatusHistoryRow[]> {
  const rows = await selectRows(
    "SELECT changed_at, old_status, new_status, changed_by, note FROM booking_status_history WHERE booking_id = ? LIMIT ?",
    [bookingId, limit],
  );
  return rows.map(toHistoryRow);
}

export type BookingStatusWrite = {
  bookingId: string;
  mechanicId: string;
  scheduledAt: Date | null;
  monthBucket: string;
  fromStatus: string;
  toStatus: string;
  customerId: string | null;
  zoneId: string | null;
  total: number | null;
  changedBy: string;
  note: string | null;
};

// One batch keeps every denormalized copy of the status in sync: the
// booking row, the mechanic workload row, the dispatcher status bucket and
// the tracking timeline. The status bucket is clustered by scheduled_at, so
// a booking without a schedule can only move between buckets.
export async function writeBookingStatus(
  params: BookingStatusWrite,
): Promise<void> {
  const now = new Date();
  const queries: { query: string; params: unknown[] }[] = [
    {
      query:
        "UPDATE bookings_by_id SET status = ?, updated_at = ? WHERE booking_id = ?",
      params: [params.toStatus, now, params.bookingId],
    },
    {
      query:
        "INSERT INTO bookings_by_status (status, month_bucket, scheduled_at, booking_id, customer_id, mechanic_id, zone_id, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: [
        params.toStatus,
        params.monthBucket,
        params.scheduledAt ?? now,
        params.bookingId,
        params.customerId,
        params.mechanicId,
        params.zoneId,
        params.total,
      ],
    },
    {
      query:
        "INSERT INTO booking_status_history (booking_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        params.bookingId,
        now,
        params.fromStatus,
        params.toStatus,
        params.changedBy,
        params.note,
      ],
    },
  ];

  if (params.scheduledAt) {
    queries.push(
      {
        query:
          "UPDATE bookings_by_mechanic SET status = ? WHERE mechanic_id = ? AND scheduled_at = ? AND booking_id = ?",
        params: [
          params.toStatus,
          params.mechanicId,
          params.scheduledAt,
          params.bookingId,
        ],
      },
      {
        query:
          "DELETE FROM bookings_by_status WHERE status = ? AND month_bucket = ? AND scheduled_at = ? AND booking_id = ?",
        params: [
          params.fromStatus,
          params.monthBucket,
          params.scheduledAt,
          params.bookingId,
        ],
      },
    );
  }

  await scylla.batch(queries, { prepare: true });
}
