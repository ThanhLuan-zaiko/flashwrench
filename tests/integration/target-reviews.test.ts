import { beforeEach, describe, expect, mock, test } from "bun:test";
import { encodeCursor } from "@/lib/db/cursor";
import {
  feedbackStubs,
  makeTargetReviewRow,
  resetFeedbackMocks,
  reviewRepoMocks,
} from "../helpers/feedback.mocks";
import { makePartRow } from "../helpers/parts.fixtures";
import {
  partRepoMocks,
  partStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";

mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module("@/lib/reviews/reviews.repository", () => reviewRepoMocks);

import {
  listMechanicReviews,
  listPartReviews,
} from "@/lib/reviews/target-reviews.service";

const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const MECHANIC_ID = "56565656-5656-4565-8565-565656565656";
const SLUG = "dau-nhot-10w-40";

beforeEach(() => {
  resetPartsMocks();
  resetFeedbackMocks();
  partStubs.partSlugOwner = PART_ID;
  partStubs.partById = makePartRow({ part_id: PART_ID });
});

describe("listPartReviews", () => {
  test("resolves the slug and returns items with the counter summary", async () => {
    feedbackStubs.targetReviewPage = {
      rows: [makeTargetReviewRow({ rating: 5 })],
      pageState: "ps-1",
    };
    feedbackStubs.ratingCounter = { total_score: 9, total_count: 2 };
    const result = await listPartReviews(SLUG, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.ratingAvg).toBe(4.5);
    expect(result.data.ratingCount).toBe(2);
    // A live pageState comes back as a signed cursor scoped to the target.
    expect(result.data.nextCursor).not.toBeNull();
    const last = reviewRepoMocks.listTargetReviewRows.mock.calls.at(-1);
    expect(last?.[0]).toBe("part");
    expect(last?.[1]).toBe(PART_ID);
  });

  test("unknown slugs and invalid ids read as 404/400", async () => {
    partStubs.partSlugOwner = null;
    expect(await listPartReviews(SLUG, null)).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await listPartReviews("   ", null)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  test("rejects cursors minted for another target", async () => {
    const foreign = encodeCursor("ps-9", "target-reviews:part:other-id");
    const result = await listPartReviews(SLUG, foreign);
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});

describe("listMechanicReviews", () => {
  test("aggregates the summary from target rows, not counters", async () => {
    feedbackStubs.targetReviewPage = {
      rows: [
        makeTargetReviewRow({ rating: 5 }),
        makeTargetReviewRow({ rating: 3 }),
        makeTargetReviewRow({ rating: 0 }),
      ],
      pageState: null,
    };
    // Mechanic summaries must not consult the counter table at all.
    feedbackStubs.ratingCounter = { total_score: 999, total_count: 999 };
    const result = await listMechanicReviews(MECHANIC_ID, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Valid 1-5 ratings only: 5 and 3 count, 0 is dropped.
    expect(result.data.ratingCount).toBe(2);
    expect(result.data.ratingAvg).toBe(4);
  });

  test("rejects malformed mechanic ids", async () => {
    expect(await listMechanicReviews("not-a-uuid", null)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(reviewRepoMocks.listTargetReviewRows.mock.calls.length).toBe(0);
  });
});
