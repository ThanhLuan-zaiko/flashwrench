// Raw CQL for the landing-page mechanic showcase. Reads mechanics_by_id with
// a bounded token scan; every rule (verified, active account, best first)
// lives in the service.
import { scylla } from "@/lib/db/client";
import { toDecimalOr } from "@/lib/mechanic/mechanic.types";

export type ShowcaseMechanicRow = {
  mechanic_id: string;
  display_name: string | null;
  skills: string[] | null;
  is_verified: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  completed_jobs: number | null;
};

type RawRow = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringList(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(String);
  if (value instanceof Set) return [...value].map(String);
  return null;
}

function toRow(raw: RawRow): ShowcaseMechanicRow {
  return {
    mechanic_id: String(raw.mechanic_id),
    display_name: toStringOrNull(raw.display_name),
    skills: toStringList(raw.skills),
    is_verified: raw.is_verified === true,
    // rating_avg is DECIMAL: the driver hands back an object, not a number.
    rating_avg:
      raw.rating_avg === null || raw.rating_avg === undefined
        ? null
        : toDecimalOr(raw.rating_avg),
    rating_count: toNumberOrNull(raw.rating_count),
    completed_jobs: toNumberOrNull(raw.completed_jobs),
  };
}

/**
 * Query: bounded profile scan for the landing showcase. The table is
 * small in dev and LIMIT stops the scan early; ranking happens in memory,
 * so no ORDER BY / ALLOW FILTERING is needed.
 */
export async function scanMechanicShowcaseRows(
  limit: number,
): Promise<ShowcaseMechanicRow[]> {
  const result = await scylla.execute(
    "SELECT mechanic_id, display_name, skills, is_verified, rating_avg, rating_count, completed_jobs FROM mechanics_by_id LIMIT ?",
    [limit],
    { prepare: true },
  );
  return (result.rows as unknown as RawRow[]).map(toRow);
}
