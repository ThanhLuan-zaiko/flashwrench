// Public review listings: newest-first pages over reviews_by_target for
// product pages (part) and mechanic profiles (mechanic), plus a rating
// summary. Part summaries read the counter row maintained on each write;
// mechanic summaries scan the partition like the mechanic stats page so
// booking-written reviews (which never touch counters) still count.
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { findPartIdBySlug } from "@/lib/parts/parts.repository";
import { isUuid } from "@/lib/validation";
import type {
  ReviewPage,
  ReviewResult,
  ReviewTargetType,
} from "./review.types";
import { toIso } from "./review.types";
import { listTargetReviewRows, readRatingCounter } from "./reviews.repository";

export const TARGET_REVIEW_PAGE = 8;
const MECHANIC_SUMMARY_SCAN = 200;
const MAX_STARS = 5;

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
  const page = await listTargetReviewRows(
    targetType,
    targetId,
    MECHANIC_SUMMARY_SCAN,
    null,
  );
  const ratings = page.rows
    .map((row) => row.rating ?? 0)
    .filter((rating) => rating >= 1 && rating <= MAX_STARS);
  const count = ratings.length;
  return {
    ratingAvg:
      count > 0
        ? Math.round(
            (ratings.reduce((total, rating) => total + rating, 0) / count) * 10,
          ) / 10
        : 0,
    ratingCount: count,
  };
}

async function listReviews(
  targetType: ReviewTargetType,
  targetId: string,
  cursor: string | null | undefined,
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
  return {
    ok: true,
    data: {
      items: page.rows.map((row) => ({
        id: row.review_id,
        rating: row.rating ?? 0,
        body: [row.title ?? "", row.body ?? ""]
          .filter((part) => part.length > 0)
          .join(" — "),
        customerName: row.customer_name ?? "Khách hàng",
        createdAt: toIso(row.created_at),
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
): Promise<ReviewResult<TargetReviewsPayload>> {
  const decoded = decodeURIComponent(slug).trim();
  if (!decoded) return fail(400, "Sản phẩm không hợp lệ.");
  const partId = await findPartIdBySlug(decoded);
  if (!partId || !isUuid(partId)) return fail(404, "Không tìm thấy sản phẩm.");
  return listReviews("part", partId, cursor);
}

// Public mechanic profile reviews feed the picker/profile surfaces.
export async function listMechanicReviews(
  mechanicId: string,
  cursor: string | null | undefined,
): Promise<ReviewResult<TargetReviewsPayload>> {
  if (!isUuid(mechanicId)) return fail(400, "Mã thợ không hợp lệ.");
  return listReviews("mechanic", mechanicId, cursor);
}
