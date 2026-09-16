// Raw CQL for the bookable mechanic directory (mechanics_available).
// One small partition keeps the customer picker to a single bounded read.
// No business logic here: services decide who is listed.
import { scylla } from "@/lib/db/client";

export type AvailableMechanicRow = {
  mechanic_id: string;
  display_name: string | null;
  skills: string[] | null;
  base_lat: number | null;
  base_lng: number | null;
  is_online: boolean | null;
  is_verified: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  completed_jobs: number | null;
};

export type UpsertAvailableMechanicParams = {
  mechanicId: string;
  displayName: string | null;
  skills: string[] | null;
  baseLat: number | null;
  baseLng: number | null;
  isOnline: boolean | null;
  isVerified: boolean | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  completedJobs: number | null;
};

type RawRow = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolOrNull(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  return value === true;
}

function toStringList(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(String);
  if (value instanceof Set) return [...value].map(String);
  return null;
}

function toRow(raw: RawRow): AvailableMechanicRow {
  return {
    mechanic_id: String(raw.mechanic_id),
    display_name: toStringOrNull(raw.display_name),
    skills: toStringList(raw.skills),
    base_lat: toNumberOrNull(raw.base_lat),
    base_lng: toNumberOrNull(raw.base_lng),
    is_online: toBoolOrNull(raw.is_online),
    is_verified: toBoolOrNull(raw.is_verified),
    rating_avg: toNumberOrNull(raw.rating_avg),
    rating_count: toNumberOrNull(raw.rating_count),
    completed_jobs: toNumberOrNull(raw.completed_jobs),
  };
}

/** Query: bookable directory, best rated first (one bounded partition). */
export async function listAvailableMechanicRows(
  limit: number,
): Promise<AvailableMechanicRow[]> {
  const result = await scylla.execute(
    "SELECT mechanic_id, display_name, skills, base_lat, base_lng, is_online, is_verified, rating_avg, rating_count, completed_jobs FROM mechanics_available WHERE bucket = ? LIMIT ?",
    ["all", limit],
    { prepare: true },
  );
  return (result.rows as unknown as RawRow[]).map(toRow);
}

export async function upsertAvailableMechanic(
  params: UpsertAvailableMechanicParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO mechanics_available (bucket, rating_avg, mechanic_id, display_name, skills, base_lat, base_lng, is_online, is_verified, rating_count, completed_jobs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      "all",
      params.ratingAvg,
      params.mechanicId,
      params.displayName,
      params.skills,
      params.baseLat,
      params.baseLng,
      params.isOnline,
      params.isVerified,
      params.ratingCount,
      params.completedJobs,
    ],
    { prepare: true },
  );
}

// Deletes need the full clustering key: callers read the profile row
// first so a rating change never orphans a directory entry.
export async function deleteAvailableMechanic(
  ratingAvg: number | null,
  mechanicId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM mechanics_available WHERE bucket = ? AND rating_avg = ? AND mechanic_id = ?",
    ["all", ratingAvg, mechanicId],
    { prepare: true },
  );
}
