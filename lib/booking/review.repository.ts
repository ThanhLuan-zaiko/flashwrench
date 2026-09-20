import { scylla } from "@/lib/db/client";

export type BookingReviewRow = {
  booking_id: string;
  review_id: string;
  customer_id: string | null;
  mechanic_id: string | null;
  customer_name: string | null;
  rating: number | null;
  body: string | null;
  created_at: Date | null;
};

export type BookingReviewWrite = {
  bookingId: string;
  reviewId: string;
  customerId: string;
  mechanicId: string;
  customerName: string;
  rating: number;
  body: string;
  createdAt: Date;
};

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

function toReviewRow(raw: RawRow): BookingReviewRow {
  return {
    booking_id: String(raw.booking_id),
    review_id: String(raw.review_id),
    customer_id: toStringOrNull(raw.customer_id),
    mechanic_id: toStringOrNull(raw.mechanic_id),
    customer_name: toStringOrNull(raw.customer_name),
    rating: toNumberOrNull(raw.rating),
    body: toStringOrNull(raw.body),
    created_at: toDateOrNull(raw.created_at),
  };
}

export async function findReviewRowByBookingId(
  bookingId: string,
): Promise<BookingReviewRow | null> {
  const result = await scylla.execute(
    "SELECT booking_id, review_id, customer_id, mechanic_id, customer_name, rating, body, created_at FROM reviews_by_booking WHERE booking_id = ?",
    [bookingId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toReviewRow(row) : null;
}

export async function claimBookingReview(
  write: BookingReviewWrite,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO reviews_by_booking (booking_id, review_id, customer_id, mechanic_id, customer_name, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS",
    [
      write.bookingId,
      write.reviewId,
      write.customerId,
      write.mechanicId,
      write.customerName,
      write.rating,
      write.body,
      write.createdAt,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

export async function projectBookingReview(
  write: BookingReviewWrite,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO reviews_by_target (target_type, target_id, created_at, review_id, customer_id, customer_name, booking_id, rating, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          "mechanic",
          write.mechanicId,
          write.createdAt,
          write.reviewId,
          write.customerId,
          write.customerName,
          write.bookingId,
          write.rating,
          write.body,
        ],
      },
      {
        query:
          "INSERT INTO reviews_by_customer (customer_id, created_at, review_id, target_type, target_id, rating) VALUES (?, ?, ?, ?, ?, ?)",
        params: [
          write.customerId,
          write.createdAt,
          write.reviewId,
          "mechanic",
          write.mechanicId,
          write.rating,
        ],
      },
    ],
    { prepare: true },
  );
}
