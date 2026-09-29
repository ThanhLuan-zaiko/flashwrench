import { beforeEach, describe, expect, mock, test } from "bun:test";
import { encodeCursor } from "@/lib/db/cursor";
import { makePublicUser } from "../helpers/auth.fixtures";
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
  listServiceReviews,
} from "@/lib/reviews/target-reviews.service";

const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const MECHANIC_ID = "56565656-5656-4565-8565-565656565656";
const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
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
    const result = await listPartReviews(SLUG, null, null);
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
    expect(await listPartReviews(SLUG, null, null)).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await listPartReviews("   ", null, null)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  test("rejects cursors minted for another target", async () => {
    const foreign = encodeCursor("ps-9", "target-reviews:part:other-id");
    const result = await listPartReviews(SLUG, foreign, null);
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
    const result = await listMechanicReviews(MECHANIC_ID, null, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Valid 1-5 ratings only: 5 and 3 count, 0 is dropped.
    expect(result.data.ratingCount).toBe(2);
    expect(result.data.ratingAvg).toBe(4);
  });

  test("rejects malformed mechanic ids", async () => {
    expect(await listMechanicReviews("not-a-uuid", null, null)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(reviewRepoMocks.listTargetReviewRows.mock.calls.length).toBe(0);
  });
});

describe("hidden review filtering", () => {
  test("public readers never see hidden rows", async () => {
    feedbackStubs.targetReviewPage = {
      rows: [
        makeTargetReviewRow({ rating: 5 }),
        makeTargetReviewRow({ rating: 1, is_hidden: true }),
      ],
      pageState: null,
    };
    feedbackStubs.ratingCounter = { total_score: 5, total_count: 1 };
    const result = await listPartReviews(SLUG, null, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.hidden).toBe(false);
  });

  test("admin and dispatcher see hidden rows flagged", async () => {
    feedbackStubs.targetReviewPage = {
      rows: [makeTargetReviewRow({ rating: 1, is_hidden: true })],
      pageState: null,
    };
    for (const role of ["admin", "dispatcher"] as const) {
      const actor = makePublicUser({ role });
      const result = await listPartReviews(SLUG, null, actor);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]?.hidden).toBe(true);
    }
  });

  test("customers and mechanics do not get the moderator view", async () => {
    feedbackStubs.targetReviewPage = {
      rows: [makeTargetReviewRow({ rating: 1, is_hidden: true })],
      pageState: null,
    };
    for (const role of ["customer", "mechanic"] as const) {
      const result = await listPartReviews(
        SLUG,
        null,
        makePublicUser({ role }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.items).toHaveLength(0);
    }
  });

  test("hidden rows do not count toward mechanic/service summaries", async () => {
    feedbackStubs.targetReviewPage = {
      rows: [
        makeTargetReviewRow({ rating: 5 }),
        makeTargetReviewRow({ rating: 1, is_hidden: true }),
      ],
      pageState: null,
    };
    const result = await listMechanicReviews(MECHANIC_ID, null, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.ratingCount).toBe(1);
    expect(result.data.ratingAvg).toBe(5);
  });
});

describe("listServiceReviews", () => {
  test("lists the service target and aggregates rows, not counters", async () => {
    feedbackStubs.targetReviewPage = {
      rows: [
        makeTargetReviewRow({
          target_type: "service",
          target_id: SERVICE_ID,
          rating: 5,
          body: "Dich vu tot.",
          booking_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
          order_id: null,
        }),
        makeTargetReviewRow({ target_type: "service", rating: 4 }),
        makeTargetReviewRow({ target_type: "service", rating: 0 }),
      ],
      pageState: "ps-2",
    };
    // Service summaries must not consult the counter table at all.
    feedbackStubs.ratingCounter = { total_score: 999, total_count: 999 };
    const result = await listServiceReviews(SERVICE_ID, null, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(3);
    expect(result.data.items[0]).toMatchObject({
      rating: 5,
      body: "Dich vu tot.",
    });
    // Valid 1-5 ratings only: 5 and 4 count, 0 is dropped.
    expect(result.data.ratingCount).toBe(2);
    expect(result.data.ratingAvg).toBe(4.5);
    expect(result.data.nextCursor).not.toBeNull();
    const pageCall = reviewRepoMocks.listTargetReviewRows.mock.calls[0];
    expect(pageCall?.[0]).toBe("service");
    expect(pageCall?.[1]).toBe(SERVICE_ID);
    expect(reviewRepoMocks.readRatingCounter.mock.calls.length).toBe(0);
  });

  test("an unrated service reads as an empty feed", async () => {
    const result = await listServiceReviews(SERVICE_ID, null, null);
    expect(result).toMatchObject({
      ok: true,
      data: { items: [], nextCursor: null, ratingAvg: 0, ratingCount: 0 },
    });
  });

  test("rejects malformed ids and cursors minted for another service", async () => {
    expect(await listServiceReviews("not-a-uuid", null, null)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(reviewRepoMocks.listTargetReviewRows.mock.calls.length).toBe(0);
    const foreign = encodeCursor("ps-9", "target-reviews:service:other-id");
    expect(await listServiceReviews(SERVICE_ID, foreign, null)).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
