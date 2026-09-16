// Raw CQL for the mechanic workspace: profile counters, live location,
// payments and reviews. No business logic: services own every rule.
import { scylla } from "@/lib/db/client";
import {
  type MechanicLocationRow,
  type MechanicPaymentRow,
  type MechanicProfileRow,
  type MechanicReviewRow,
  toDecimalOr,
} from "./mechanic.types";

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
  return value === true;
}

function toProfileRow(raw: RawRow): MechanicProfileRow {
  return {
    mechanic_id: String(raw.mechanic_id),
    display_name: toStringOrNull(raw.display_name),
    base_lat: toNumberOrNull(raw.base_lat),
    base_lng: toNumberOrNull(raw.base_lng),
    is_verified: toBoolOrNull(raw.is_verified),
    is_online: toBoolOrNull(raw.is_online),
    is_available: toBoolOrNull(raw.is_available),
    // rating_avg is DECIMAL: the driver hands back an object, not a number.
    rating_avg:
      raw.rating_avg === null || raw.rating_avg === undefined
        ? null
        : toDecimalOr(raw.rating_avg),
    rating_count: toNumberOrNull(raw.rating_count),
    completed_jobs: toNumberOrNull(raw.completed_jobs),
  };
}

function toLocationRow(raw: RawRow): MechanicLocationRow {
  return {
    mechanic_id: String(raw.mechanic_id),
    lat: toNumberOrNull(raw.lat),
    lng: toNumberOrNull(raw.lng),
    current_job_id: toStringOrNull(raw.current_job_id),
    current_job_type: toStringOrNull(raw.current_job_type),
    updated_at: toDateOrNull(raw.updated_at),
  };
}

function toPaymentRow(raw: RawRow): MechanicPaymentRow {
  return {
    ref_type: String(raw.ref_type),
    ref_id: String(raw.ref_id),
    payment_id: String(raw.payment_id),
    amount: toNumberOrNull(raw.amount),
    status: toStringOrNull(raw.status),
    method: toStringOrNull(raw.method),
    paid_at: toDateOrNull(raw.paid_at),
    created_at: toDateOrNull(raw.created_at),
  };
}

function toReviewRow(raw: RawRow): MechanicReviewRow {
  return {
    target_type: String(raw.target_type),
    target_id: String(raw.target_id),
    review_id: String(raw.review_id),
    customer_name: toStringOrNull(raw.customer_name),
    booking_id: toStringOrNull(raw.booking_id),
    rating: toNumberOrNull(raw.rating),
    title: toStringOrNull(raw.title),
    body: toStringOrNull(raw.body),
    created_at: toDateOrNull(raw.created_at),
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

export async function findMechanicProfileRow(
  mechanicId: string,
): Promise<MechanicProfileRow | null> {
  const row = await selectFirst(
    "SELECT mechanic_id, display_name, base_lat, base_lng, is_verified, is_online, is_available, rating_avg, rating_count, completed_jobs FROM mechanics_by_id WHERE mechanic_id = ?",
    [mechanicId],
  );
  return row ? toProfileRow(row) : null;
}

/** Query: live tracking row written while the mechanic is on the move. */
export async function findMechanicLocationRow(
  mechanicId: string,
): Promise<MechanicLocationRow | null> {
  const row = await selectFirst(
    "SELECT mechanic_id, lat, lng, current_job_id, current_job_type, updated_at FROM mechanic_locations WHERE mechanic_id = ?",
    [mechanicId],
  );
  return row ? toLocationRow(row) : null;
}

export async function setMechanicAvailability(
  mechanicId: string,
  isAvailable: boolean,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE mechanics_by_id SET is_available = ?, is_online = ?, updated_at = ? WHERE mechanic_id = ?",
    [isAvailable, true, updatedAt, mechanicId],
    { prepare: true },
  );
}

// completed_jobs is a regular column (no counter), so it is a
// read-modify-write: the service reads the profile, then writes back.
export async function setMechanicCompletedJobs(
  mechanicId: string,
  completedJobs: number,
  updatedAt: Date,
): Promise<void> {
  await scylla.execute(
    "UPDATE mechanics_by_id SET completed_jobs = ?, updated_at = ? WHERE mechanic_id = ?",
    [Math.max(0, Math.trunc(completedJobs)), updatedAt, mechanicId],
    { prepare: true },
  );
}

export type MechanicLocationWrite = {
  mechanicId: string;
  lat: number;
  lng: number;
  currentJobId: string | null;
  currentJobType: "booking" | "emergency" | "none";
  updatedAt: Date;
};

export async function upsertMechanicLocation(
  params: MechanicLocationWrite,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO mechanic_locations (mechanic_id, lat, lng, current_job_id, current_job_type, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [
      params.mechanicId,
      params.lat,
      params.lng,
      params.currentJobId,
      params.currentJobType,
      params.updatedAt,
    ],
    { prepare: true },
  );
}

/** Query: transactions of a set of bookings (payments_by_ref partitions). */
export async function listPaymentRowsByRefIds(
  refType: string,
  refIds: string[],
): Promise<MechanicPaymentRow[]> {
  if (refIds.length === 0) return [];
  const results = await Promise.all(
    refIds.map((refId) =>
      selectRows(
        "SELECT ref_type, ref_id, payment_id, amount, status, method, paid_at, created_at FROM payments_by_ref WHERE ref_type = ? AND ref_id = ?",
        [refType, refId],
      ),
    ),
  );
  return results.flat().map(toPaymentRow);
}

/** Query: newest reviews of one target (single partition, DESC). */
export async function listReviewRowsByTarget(
  targetType: string,
  targetId: string,
  limit: number,
): Promise<MechanicReviewRow[]> {
  const rows = await selectRows(
    "SELECT target_type, target_id, review_id, customer_name, booking_id, rating, title, body, created_at FROM reviews_by_target WHERE target_type = ? AND target_id = ? LIMIT ?",
    [targetType, targetId, limit],
  );
  return rows.map(toReviewRow);
}
