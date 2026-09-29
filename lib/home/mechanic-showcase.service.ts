// Landing-page mechanic showcase: pick the most trusted verified mechanics
// for the home page. Degrades to an empty list when the database is
// unreachable so a marketing page can never 500 on a data outage.
import { findUserById } from "@/lib/auth/user.repository";
import { deadlineAfter } from "./budget";
import {
  type ShowcaseMechanicRow,
  scanMechanicShowcaseRows,
} from "./mechanic-showcase.repository";

export const SHOWCASE_MECHANIC_LIMIT = 6;
export const SHOWCASE_NAME_FALLBACK = "Thợ FlashWrench";

// Fetch extra rows so the in-memory verified/active filters still leave
// enough candidates for the grid when some profiles are stale.
export const SHOWCASE_SCAN_MULTIPLIER = 4;

export type ShowcaseMechanic = {
  id: string;
  displayName: string;
  skills: string[];
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
};

export type ShowcaseCandidate = {
  id: string;
  displayName: string;
  skills: string[];
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
};

function normalizeRow(row: ShowcaseMechanicRow): ShowcaseCandidate {
  return {
    id: row.mechanic_id,
    displayName: row.display_name?.trim() || SHOWCASE_NAME_FALLBACK,
    skills: (row.skills ?? []).map((skill) => skill.trim()).filter(Boolean),
    ratingAvg: row.rating_avg ?? 0,
    ratingCount: row.rating_count ?? 0,
    completedJobs: row.completed_jobs ?? 0,
  };
}

// Rated mechanics outrank unrated ones; ties fall back to review count and
// then completed jobs, mirroring the booking picker's ranking so the two
// surfaces agree.
export function selectShowcaseMechanics(
  rows: ShowcaseMechanicRow[],
  limit = SHOWCASE_MECHANIC_LIMIT,
): ShowcaseCandidate[] {
  return rows
    .filter((row) => row.is_verified === true)
    .map(normalizeRow)
    .sort((a, b) => {
      const ratedA = a.ratingCount > 0 ? 1 : 0;
      const ratedB = b.ratingCount > 0 ? 1 : 0;
      if (ratedA !== ratedB) return ratedB - ratedA;
      if (a.ratingAvg !== b.ratingAvg) return b.ratingAvg - a.ratingAvg;
      if (a.ratingCount !== b.ratingCount) return b.ratingCount - a.ratingCount;
      return b.completedJobs - a.completedJobs;
    })
    .slice(0, Math.max(0, limit));
}

// The scan does not filter accounts, so shortlisted ids get one cheap
// users_by_id read each to keep deactivated accounts off the home page.
async function withActiveAccounts(
  candidates: ShowcaseCandidate[],
): Promise<ShowcaseCandidate[]> {
  const checks = await Promise.all(
    candidates.map(async (candidate) => {
      const user = await findUserById(candidate.id);
      return user?.role === "mechanic" && user.status === "active"
        ? candidate
        : null;
    }),
  );
  return checks.filter(
    (candidate): candidate is ShowcaseCandidate => candidate !== null,
  );
}

// A marketing page must stay fast even when the database is slow: the whole
// read path races a small budget and renders without the section past it.
export const SHOWCASE_BUDGET_MS = 2500;

async function loadShowcase(limit: number): Promise<ShowcaseMechanic[]> {
  const rows = await scanMechanicShowcaseRows(
    Math.max(1, limit) * SHOWCASE_SCAN_MULTIPLIER,
  );
  // Presence is intentionally not read: the landing markets trust, not
  // live availability; the booking picker owns the online filter.
  return withActiveAccounts(selectShowcaseMechanics(rows, limit));
}

export async function listShowcaseMechanics(
  limit = SHOWCASE_MECHANIC_LIMIT,
): Promise<ShowcaseMechanic[]> {
  try {
    return await Promise.race([
      loadShowcase(limit),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Mechanic showcase"),
    ]);
  } catch {
    return [];
  }
}
