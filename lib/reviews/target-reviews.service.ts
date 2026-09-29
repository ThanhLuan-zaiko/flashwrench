// Public review listings: newest-first pages over reviews_by_target for
// product pages (part), mechanic profiles (mechanic) and the booking page
// (service), plus a rating summary. Part summaries read the counter row
// maintained on each write; mechanic and service summaries scan the
// partition (see rating-scan.service.ts) so booking-written reviews, which
// never touch counters, still count.
import type { PublicUser, UserRole } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { findPartIdBySlug } from "@/lib/parts/parts.repository";
import { isUuid } from "@/lib/validation";
import { scanRatingSummary } from "./rating-scan.service";
import type {
  ReviewPage,
  ReviewResult,
  ReviewTargetType,
} from "./review.types";
import { toIso } from "./review.types";
import { listTargetReviewRows, readRatingCounter } from "./reviews.repository";

export const TARGET_REVIEW_PAGE = 8;

const MODERATOR_ROLES: UserRole[] = ["admin", "dispatcher"];

// Hidden reviews stay visible to moderators (dimmed in the UI) and drop
// out of public feeds for everyone else.
export function canModerateReviews(actor: PublicUser | null): boolean {
  return actor !== null && MODERATOR_ROLES.includes(actor.role);
}

export type TargetReviewsPayload = {
  items: ReviewPage["items"];
  nextCursor: string | null;
  ratingAvg: number;
  ratingCount: number;
};

function fail<T>(status: number, form: string): ReviewResult<T> {
  return { ok: false, status, errors: { form } };
}

function cursorScope(targetType: string, targetId: string): string {
  return `target-reviews:${targetType}:${targetId}`;
}

async function ratingSummary(
  targetType: ReviewTargetType,
  targetId: string,
): Promise<{ ratingAvg: number; ratingCount: number }> {
  if (targetType === "part") {
    const counter = await readRatingCounter("part", targetId);
    const count = counter?.total_count ?? 0;
    const score = counter?.total_score ?? 0;
    return {
      ratingAvg: count > 0 ? Math.round((score / count) * 10) / 10 : 0,
      ratingCount: count,
    };
  }
  return scanRatingSummary(targetType, targetId);
}

async function listReviews(
  targetType: ReviewTargetType,
  targetId: string,
  cursor: string | null | undefined,
  actor: PublicUser | null,
): Promise<ReviewResult<TargetReviewsPayload>> {
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(cursor ?? null, cursorScope(targetType, targetId));
  } catch {
    return fail(400, "Con trỏ phân trang không hợp lệ.");
  }
  const [page, summary] = await Promise.all([
    listTargetReviewRows(targetType, targetId, TARGET_REVIEW_PAGE, pageState),
    ratingSummary(targetType, targetId),
  ]);
  const rows = canModerateReviews(actor)
    ? page.rows
    : page.rows.filter((row) => row.is_hidden !== true);
  return {
    ok: true,
    data: {
      items: rows.map((row) => ({
        id: row.review_id,
        rating: row.rating ?? 0,
        body: [row.title ?? "", row.body ?? ""]
          .filter((part) => part.length > 0)
          .join(" — "),
        customerName: row.customer_name ?? "Khách hàng",
        createdAt: toIso(row.created_at),
        hidden: row.is_hidden === true,
      })),
      nextCursor: encodeCursor(
        page.pageState,
        cursorScope(targetType, targetId),
      ),
      ...summary,
    },
  };
}

// Product page reviews: slug resolves to the part id before listing.
export async function listPartReviews(
  slug: string,
  cursor: string | null | undefined,
  actor: PublicUser | null,
): Promise<ReviewResult<TargetReviewsPayload>> {
  const decoded = decodeURIComponent(slug).trim();
  if (!decoded) return fail(400, "Sản phẩm không hợp lệ.");
  const partId = await findPartIdBySlug(decoded);
  if (!partId || !isUuid(partId)) return fail(404, "Không tìm thấy sản phẩm.");
  return listReviews("part", partId, cursor, actor);
}

// Public mechanic profile reviews feed the picker/profile surfaces.
export async function listMechanicReviews(
  mechanicId: string,
  cursor: string | null | undefined,
  actor: PublicUser | null,
): Promise<ReviewResult<TargetReviewsPayload>> {
  if (!isUuid(mechanicId)) return fail(400, "Mã thợ không hợp lệ.");
  return listReviews("mechanic", mechanicId, cursor, actor);
}

// Public service reviews for the booking page: the service part of each
// completed booking's review, newest first.
export async function listServiceReviews(
  serviceId: string,
  cursor: string | null | undefined,
  actor: PublicUser | null,
): Promise<ReviewResult<TargetReviewsPayload>> {
  if (!isUuid(serviceId)) return fail(400, "Mã dịch vụ không hợp lệ.");
  return listReviews("service", serviceId, cursor, actor);
}
