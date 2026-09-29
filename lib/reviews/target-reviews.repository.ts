// Raw CQL for the public per-target review feed and its moderation:
// paged reads of reviews_by_target, the reviews_by_id lookup used to
// locate a projection for hide/unhide, and the hidden-flag writes.
// Write-side claims and counters live in reviews.repository.ts.
import { scylla } from "@/lib/db/client";
import type { ReviewProjectionRow, TargetReviewRow } from "./review.types";

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

function toBoolOrNull(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  return value === true || value === "true";
}

function toTargetReviewRow(raw: RawRow): TargetReviewRow {
  return {
    target_type: String(raw.target_type),
    target_id: String(raw.target_id),
    created_at: toDateOrNull(raw.created_at),
    review_id: String(raw.review_id),
    customer_id: toStringOrNull(raw.customer_id),
    customer_name: toStringOrNull(raw.customer_name),
    booking_id: toStringOrNull(raw.booking_id),
    order_id: toStringOrNull(raw.order_id),
    rescue_id: toStringOrNull(raw.rescue_id),
    rating: toNumberOrNull(raw.rating),
    title: toStringOrNull(raw.title),
    body: toStringOrNull(raw.body),
    is_hidden: toBoolOrNull(raw.is_hidden),
  };
}

// Public per-target review list, newest first with driver pageState.
export async function listTargetReviewRows(
  targetType: string,
  targetId: string,
  limit: number,
  pageState: string | null,
): Promise<{ rows: TargetReviewRow[]; pageState: string | null }> {
  const result = await scylla.execute(
    "SELECT target_type, target_id, created_at, review_id, customer_id, customer_name, booking_id, order_id, rescue_id, rating, title, body, is_hidden FROM reviews_by_target WHERE target_type = ? AND target_id = ?",
    [targetType, targetId],
    {
      prepare: true,
      fetchSize: limit,
      pageState: pageState ?? undefined,
    },
  );
  return {
    rows: result.rows.map((r) => toTargetReviewRow(r as unknown as RawRow)),
    pageState: result.pageState ?? null,
  };
}

function toReviewProjectionRow(raw: RawRow): ReviewProjectionRow {
  return {
    review_id: String(raw.review_id),
    target_type: String(raw.target_type),
    target_id: String(raw.target_id),
    created_at: toDateOrNull(raw.created_at),
    rating: toNumberOrNull(raw.rating),
  };
}

// Moderation: locate a review's projection row (its partition + cluster
// keys) and read the rating so a hide can un-count it for parts.
export async function findReviewProjection(
  reviewId: string,
  targetType: string,
  targetId: string,
): Promise<ReviewProjectionRow | null> {
  const result = await scylla.execute(
    "SELECT review_id, target_type, target_id, created_at, rating FROM reviews_by_id WHERE review_id = ? AND target_type = ? AND target_id = ?",
    [reviewId, targetType, targetId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toReviewProjectionRow(row) : null;
}

// Rows projected before reviews_by_id existed have no lookup entry. A
// bounded scan inside one target partition finds the projection so staff
// can still hide it; the caller backfills reviews_by_id afterwards.
export async function findTargetReviewRowById(
  targetType: string,
  targetId: string,
  reviewId: string,
): Promise<ReviewProjectionRow | null> {
  const result = await scylla.execute(
    "SELECT review_id, target_type, target_id, created_at, rating FROM reviews_by_target WHERE target_type = ? AND target_id = ? AND review_id = ? ALLOW FILTERING",
    [targetType, targetId, reviewId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toReviewProjectionRow(row) : null;
}

export async function indexReviewProjection(
  row: ReviewProjectionRow,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO reviews_by_id (review_id, target_type, target_id, created_at, rating) VALUES (?, ?, ?, ?, ?)",
    [row.review_id, row.target_type, row.target_id, row.created_at, row.rating],
    { prepare: true },
  );
}

export async function readReviewHidden(
  projection: ReviewProjectionRow,
): Promise<boolean> {
  const result = await scylla.execute(
    "SELECT is_hidden FROM reviews_by_target WHERE target_type = ? AND target_id = ? AND created_at = ? AND review_id = ?",
    [
      projection.target_type,
      projection.target_id,
      projection.created_at,
      projection.review_id,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row?.is_hidden === true;
}

export async function setTargetReviewHidden(params: {
  projection: ReviewProjectionRow;
  hidden: boolean;
  staffId: string;
}): Promise<void> {
  const { projection, hidden, staffId } = params;
  await scylla.execute(
    "UPDATE reviews_by_target SET is_hidden = ?, hidden_by = ?, hidden_at = ? WHERE target_type = ? AND target_id = ? AND created_at = ? AND review_id = ?",
    [
      hidden,
      staffId,
      hidden ? new Date() : null,
      projection.target_type,
      projection.target_id,
      projection.created_at,
      projection.review_id,
    ],
    { prepare: true },
  );
}
