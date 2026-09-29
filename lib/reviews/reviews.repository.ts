// Raw CQL for the review domain. Claim tables guarantee one review per
// source (order / order-part / rescue); projections fan the accepted
// review out to the public target list, the author's history, the
// rating counters and — for parts — the denormalized product rating.
import { scylla } from "@/lib/db/client";
import type {
  OrderPartReviewRow,
  OrderReviewRow,
  RatingCounterRow,
  RescueReviewRow,
} from "./review.types";

// Public-feed reads and moderation live in the sibling repository so this
// file stays the write-side aggregate; re-export keeps existing imports
// (and test module mocks) working unchanged.
export {
  findReviewProjection,
  findTargetReviewRowById,
  indexReviewProjection,
  listTargetReviewRows,
  readReviewHidden,
  setTargetReviewHidden,
} from "./target-reviews.repository";

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

function toOrderReviewRow(raw: RawRow): OrderReviewRow {
  return {
    order_id: String(raw.order_id),
    review_id: String(raw.review_id),
    customer_id: toStringOrNull(raw.customer_id),
    customer_name: toStringOrNull(raw.customer_name),
    rating: toNumberOrNull(raw.rating),
    body: toStringOrNull(raw.body),
    created_at: toDateOrNull(raw.created_at),
  };
}

function toOrderPartReviewRow(raw: RawRow): OrderPartReviewRow {
  return { ...toOrderReviewRow(raw), part_id: String(raw.part_id) };
}

function toRescueReviewRow(raw: RawRow): RescueReviewRow {
  return {
    request_id: String(raw.request_id),
    review_id: String(raw.review_id),
    customer_id: toStringOrNull(raw.customer_id),
    mechanic_id: toStringOrNull(raw.mechanic_id),
    customer_name: toStringOrNull(raw.customer_name),
    rating: toNumberOrNull(raw.rating),
    body: toStringOrNull(raw.body),
    created_at: toDateOrNull(raw.created_at),
  };
}

const ORDER_REVIEW_COLUMNS =
  "order_id, review_id, customer_id, customer_name, rating, body, created_at";

export async function findOrderReviewRow(
  orderId: string,
): Promise<OrderReviewRow | null> {
  const result = await scylla.execute(
    `SELECT ${ORDER_REVIEW_COLUMNS} FROM reviews_by_order WHERE order_id = ?`,
    [orderId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toOrderReviewRow(row) : null;
}

export async function listOrderPartReviewRows(
  orderId: string,
): Promise<OrderPartReviewRow[]> {
  const result = await scylla.execute(
    `SELECT ${ORDER_REVIEW_COLUMNS}, part_id FROM reviews_by_order_part WHERE order_id = ?`,
    [orderId],
    { prepare: true },
  );
  return result.rows.map((r) => toOrderPartReviewRow(r as unknown as RawRow));
}

export async function findRescueReviewRow(
  requestId: string,
): Promise<RescueReviewRow | null> {
  const result = await scylla.execute(
    "SELECT request_id, review_id, customer_id, mechanic_id, customer_name, rating, body, created_at FROM reviews_by_rescue WHERE request_id = ?",
    [requestId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toRescueReviewRow(row) : null;
}

// LWT claims return [applied]; a false result means a review already exists.
async function applied(result: { first: () => unknown }): Promise<boolean> {
  const row = result.first() as RawRow | null;
  return row?.["[applied]"] === true;
}

export async function claimOrderReview(write: {
  orderId: string;
  reviewId: string;
  customerId: string;
  customerName: string;
  rating: number;
  body: string;
  createdAt: Date;
}): Promise<boolean> {
  const result = await scylla.execute(
    `INSERT INTO reviews_by_order (${ORDER_REVIEW_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS`,
    [
      write.orderId,
      write.reviewId,
      write.customerId,
      write.customerName,
      write.rating,
      write.body,
      write.createdAt,
    ],
    { prepare: true },
  );
  return applied(result);
}

export async function claimOrderPartReview(write: {
  orderId: string;
  partId: string;
  reviewId: string;
  customerId: string;
  customerName: string;
  rating: number;
  body: string;
  createdAt: Date;
}): Promise<boolean> {
  const result = await scylla.execute(
    `INSERT INTO reviews_by_order_part (${ORDER_REVIEW_COLUMNS}, part_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS`,
    [
      write.orderId,
      write.reviewId,
      write.customerId,
      write.customerName,
      write.rating,
      write.body,
      write.createdAt,
      write.partId,
    ],
    { prepare: true },
  );
  return applied(result);
}

export async function claimRescueReview(write: {
  requestId: string;
  reviewId: string;
  customerId: string;
  mechanicId: string;
  customerName: string;
  rating: number;
  body: string;
  createdAt: Date;
}): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO reviews_by_rescue (request_id, review_id, customer_id, mechanic_id, customer_name, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS",
    [
      write.requestId,
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
  return applied(result);
}

// Projection: the public per-target list plus the author's history. The
// source column (booking_id / order_id / rescue_id) back-links the review.
export async function projectTargetReview(write: {
  targetType: string;
  targetId: string;
  reviewId: string;
  customerId: string;
  customerName: string;
  rating: number;
  body: string;
  createdAt: Date;
  bookingId?: string | null;
  orderId?: string | null;
  rescueId?: string | null;
}): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO reviews_by_target (target_type, target_id, created_at, review_id, customer_id, customer_name, booking_id, order_id, rescue_id, rating, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          write.targetType,
          write.targetId,
          write.createdAt,
          write.reviewId,
          write.customerId,
          write.customerName,
          write.bookingId ?? null,
          write.orderId ?? null,
          write.rescueId ?? null,
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
          write.targetType,
          write.targetId,
          write.rating,
        ],
      },
      {
        // Lookup so staff can hide this projection by review id alone.
        query:
          "INSERT INTO reviews_by_id (review_id, target_type, target_id, created_at, rating) VALUES (?, ?, ?, ?, ?)",
        params: [
          write.reviewId,
          write.targetType,
          write.targetId,
          write.createdAt,
          write.rating,
        ],
      },
    ],
    { prepare: true },
  );
}

// Counters live in their own batch: counter writes cannot mix with
// regular statements in one logged batch. Negative deltas un-count a
// hidden review on the same path.
export async function bumpRatingCounter(
  targetType: string,
  targetId: string,
  score: number,
  countDelta = 1,
): Promise<void> {
  await scylla.execute(
    "UPDATE rating_counters SET total_score = total_score + ?, total_count = total_count + ? WHERE target_type = ? AND target_id = ?",
    [score, countDelta, targetType, targetId],
    { prepare: true },
  );
}

export async function readRatingCounter(
  targetType: string,
  targetId: string,
): Promise<RatingCounterRow | null> {
  const result = await scylla.execute(
    "SELECT total_score, total_count FROM rating_counters WHERE target_type = ? AND target_id = ?",
    [targetType, targetId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row
    ? {
        total_score: toNumberOrNull(row.total_score),
        total_count: toNumberOrNull(row.total_count),
      }
    : null;
}

// Part rating denormalization: the product detail row carries avg+count,
// the category card row carries the avg shown on shop listings.
export async function updatePartRating(params: {
  partId: string;
  categoryId: string | null;
  categoryCreatedAt: Date | null;
  ratingAvg: number;
  ratingCount: number;
}): Promise<void> {
  await scylla.execute(
    "UPDATE parts_by_id SET rating_avg = ?, rating_count = ?, updated_at = ? WHERE part_id = ?",
    [params.ratingAvg, params.ratingCount, new Date(), params.partId],
    { prepare: true },
  );
  if (params.categoryId && params.categoryCreatedAt) {
    await scylla.execute(
      "UPDATE parts_by_category SET rating_avg = ? WHERE category_id = ? AND created_at = ? AND part_id = ?",
      [
        params.ratingAvg,
        params.categoryId,
        params.categoryCreatedAt,
        params.partId,
      ],
      { prepare: true },
    );
  }
}

// Public per-target review list, the reviews_by_id lookup and the hidden
// flag writes live in target-reviews.repository.ts and are re-exported at
// the top of this file for existing importers.
