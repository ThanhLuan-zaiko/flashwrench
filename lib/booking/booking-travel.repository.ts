import { scylla } from "@/lib/db/client";
import { BOOKING_TRAVEL_TTL_SECONDS } from "./booking-travel.constants";

export type BookingTravelPointRow = {
  recorded_at: Date | null;
  lat: number | null;
  lng: number | null;
};

export type BookingTravelPointWrite = {
  bookingId: string;
  mechanicId: string;
  lat: number;
  lng: number;
  recordedAt: Date;
};

const MAX_TRAVEL_POINTS = 5000;

type RawRow = Record<string, unknown>;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function insertBookingTravelPoint(
  point: BookingTravelPointWrite,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO booking_travel_points_by_booking (booking_id, recorded_at, mechanic_id, lat, lng) VALUES (?, ?, ?, ?, ?) USING TTL ?",
    [
      point.bookingId,
      point.recordedAt,
      point.mechanicId,
      point.lat,
      point.lng,
      BOOKING_TRAVEL_TTL_SECONDS,
    ],
    { prepare: true },
  );
}

export async function listBookingTravelPoints(
  bookingId: string,
): Promise<BookingTravelPointRow[]> {
  const result = await scylla.execute(
    "SELECT recorded_at, lat, lng FROM booking_travel_points_by_booking WHERE booking_id = ? LIMIT ?",
    [bookingId, MAX_TRAVEL_POINTS],
    { prepare: true },
  );
  return (result.rows as unknown as RawRow[]).map((row) => ({
    recorded_at: toDate(row.recorded_at),
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
  }));
}
