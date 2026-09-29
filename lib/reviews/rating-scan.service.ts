// Rating summaries read from the public review rows of one target. Mechanic
// and service reviews are written by booking flows that repair their
// projections on retry, so they never touch counters (a counter bump would
// double count a repaired review). Their summary comes from the newest rows
// of the target partition instead, like the mechanic stats page.
import { type RatingSummary, summarizeRatings } from "./rating-summary";
import type { ReviewTargetType } from "./review.types";
import { listTargetReviewRows } from "./reviews.repository";

export const RATING_SCAN_LIMIT = 200;

export async function scanRatingSummary(
  targetType: ReviewTargetType,
  targetId: string,
): Promise<RatingSummary> {
  const page = await listTargetReviewRows(
    targetType,
    targetId,
    RATING_SCAN_LIMIT,
    null,
  );
  return summarizeRatings(
    page.rows
      .filter((row) => row.is_hidden !== true)
      .map((row) => row.rating ?? 0),
  );
}
