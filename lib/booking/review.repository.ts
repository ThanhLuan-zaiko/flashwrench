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
  service_rating: number | null;
  service_body: string | null;
};

// `rating`/`body` rate the mechanic. `serviceRating` (nullable) rates the
// booked services and is projected once per entry of `serviceIds`.
export type BookingReviewWrite = {
  bookingId: string;
  reviewId: string;
  customerId: string;
  mechanicId: string;
  customerName: string;
  rating: number;
  body: string;
  createdAt: Date;
  serviceRating: number | null;
  serviceBody: string;
  serviceIds: string[];
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
    service_rating: toNumberOrNull(raw.service_rating),
    service_body: toStringOrNull(raw.service_body),
  };
}

export async function findReviewRowByBookingId(
  bookingId: string,
): Promise<BookingReviewRow | null> {
  const result = await scylla.execute(
    "SELECT booking_id, review_id, customer_id, mechanic_id, customer_name, rating, body, created_at, service_rating, service_body FROM reviews_by_booking WHERE booking_id = ?",
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
    "INSERT INTO reviews_by_booking (booking_id, review_id, customer_id, mechanic_id, customer_name, rating, body, created_at, service_rating, service_body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS",
    [
      write.bookingId,
      write.reviewId,
      write.customerId,
      write.mechanicId,
      write.customerName,
      write.rating,
      write.body,
      write.createdAt,
      write.serviceRating,
      write.serviceRating === null ? null : write.serviceBody,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

// Projection: the mechanic list plus the author's history, and — when the
// customer also rated the service — one public row per booked service.
// Every statement is an upsert on a fixed key, so a retry repairs safely.
// The customer history keeps the mechanic row only: a second row would
// share its (customer, created_at, review_id) key.
export async function projectBookingReview(
  write: BookingReviewWrite,
): Promise<void> {
  const serviceRows =
    write.serviceRating === null
      ? []
      : write.serviceIds.flatMap((serviceId) => [
          {
            query:
              "INSERT INTO reviews_by_target (target_type, target_id, created_at, review_id, customer_id, customer_name, booking_id, rating, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params: [
              "service",
              serviceId,
              write.createdAt,
              write.reviewId,
              write.customerId,
              write.customerName,
              write.bookingId,
              write.serviceRating,
              write.serviceBody,
            ],
          },
          {
            query:
              "INSERT INTO reviews_by_id (review_id, target_type, target_id, created_at, rating) VALUES (?, ?, ?, ?, ?)",
            params: [
              write.reviewId,
              "service",
              serviceId,
              write.createdAt,
              write.serviceRating,
            ],
          },
        ]);
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
      {
        // Lookup so staff can hide the mechanic projection by review id.
        query:
          "INSERT INTO reviews_by_id (review_id, target_type, target_id, created_at, rating) VALUES (?, ?, ?, ?, ?)",
        params: [
          write.reviewId,
          "mechanic",
          write.mechanicId,
          write.createdAt,
          write.rating,
        ],
      },
      ...serviceRows,
    ],
    { prepare: true },
  );
}
