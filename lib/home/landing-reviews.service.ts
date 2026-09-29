// Real customer reviews for the landing page. One bounded scan of
// reviews_by_target collects rows across every target kind at once —
// mechanics, services, parts and orders — then target names resolve with
// point reads for the few surviving reviews only. Degrades to [] on any
// failure so the marketing page never 500s on data.
import { findServiceRowById } from "@/lib/catalog/services.repository";
import { findMechanicProfileRow } from "@/lib/mechanic/mechanic-workspace.repository";
import { findPartRowById } from "@/lib/parts/parts.repository";
import type { TargetReviewRow } from "@/lib/reviews/review.types";
import { toIso } from "@/lib/reviews/review.types";
import { scanReviewRows } from "@/lib/reviews/target-reviews.repository";
import { deadlineAfter } from "./budget";
import { SHOWCASE_BUDGET_MS } from "./mechanic-showcase.service";

export const LANDING_REVIEW_LIMIT = 6;
export const LANDING_MIN_RATING = 4;
// Buffer over the limit: hidden rows, low ratings, duplicate projections
// and unresolvable targets all shrink the scan before it reaches the page.
export const LANDING_SCAN_LIMIT = 60;

export type LandingReviewTargetKind = "mechanic" | "service" | "part" | "order";

export type LandingReview = {
  id: string;
  rating: number;
  quote: string;
  customerName: string;
  targetKind: LandingReviewTargetKind;
  targetName: string;
  createdAt: string | null;
};

type ResolvedTarget = {
  kind: LandingReviewTargetKind;
  name: string;
};

// Keep only visible positive rows with real content, newest first. The
// same review can project under several targets (booking review writes a
// mechanic row and a service row), so dedupe by review id.
export function pickLandingReviewRows(
  rows: TargetReviewRow[],
  limit = LANDING_REVIEW_LIMIT,
): TargetReviewRow[] {
  const seen = new Set<string>();
  return rows
    .filter((row) => row.is_hidden !== true)
    .filter((row) => (row.rating ?? 0) >= LANDING_MIN_RATING)
    .filter(
      (row) => [row.title ?? "", row.body ?? ""].join(" ").trim().length > 0,
    )
    .sort(
      (a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0),
    )
    .filter((row) => {
      if (seen.has(row.review_id)) return false;
      seen.add(row.review_id);
      return true;
    })
    .slice(0, Math.max(0, limit));
}

export function toLandingReview(
  row: TargetReviewRow,
  target: ResolvedTarget,
): LandingReview {
  return {
    id: row.review_id,
    rating: row.rating ?? 0,
    quote: [row.title ?? "", row.body ?? ""]
      .filter((part) => part.trim().length > 0)
      .join(" — "),
    customerName: row.customer_name?.trim() || "Khách hàng",
    targetKind: target.kind,
    targetName: target.name,
    createdAt: toIso(row.created_at),
  };
}

// Order targets carry no display name anywhere; a short id is the honest
// label (reviews can only project onto real orders anyway).
export function orderTargetLabel(orderId: string): string {
  return `#${orderId.replaceAll("-", "").slice(0, 8)}`;
}

async function resolveTarget(
  row: TargetReviewRow,
): Promise<ResolvedTarget | null> {
  switch (row.target_type) {
    case "mechanic": {
      const profile = await findMechanicProfileRow(row.target_id);
      const name = profile?.display_name?.trim();
      return name ? { kind: "mechanic", name } : null;
    }
    case "service": {
      const service = await findServiceRowById(row.target_id);
      const name = service?.name?.trim();
      return name ? { kind: "service", name } : null;
    }
    case "part": {
      const part = await findPartRowById(row.target_id);
      const name = part?.name?.trim();
      return name ? { kind: "part", name } : null;
    }
    case "order":
      return { kind: "order", name: orderTargetLabel(row.target_id) };
    default:
      return null;
  }
}

async function loadLandingReviews(limit: number): Promise<LandingReview[]> {
  const rows = await scanReviewRows(Math.max(LANDING_SCAN_LIMIT, limit * 10));
  // Resolve a few extra targets so stale rows never leave the strip short.
  const picked = pickLandingReviewRows(rows, limit + 4);
  const resolved = await Promise.all(
    picked.map(async (row) => {
      try {
        const target = await resolveTarget(row);
        return target ? toLandingReview(row, target) : null;
      } catch {
        return null;
      }
    }),
  );
  return resolved
    .filter((review): review is LandingReview => review !== null)
    .slice(0, limit);
}

export async function listLandingReviews(
  limit = LANDING_REVIEW_LIMIT,
): Promise<LandingReview[]> {
  try {
    return await Promise.race([
      loadLandingReviews(limit),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Landing reviews"),
    ]);
  } catch {
    return [];
  }
}
