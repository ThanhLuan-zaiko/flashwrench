import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  feedbackStubs,
  makeReviewProjectionRow,
  resetFeedbackMocks,
  reviewRepoMocks,
} from "../helpers/feedback.mocks";
import { makePartRow } from "../helpers/parts.fixtures";
import {
  orderRepoMocks,
  partRepoMocks,
  partStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";
import { realtimePublishMocks, resetRouteMocks } from "../helpers/route-mocks";

mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module("@/lib/reviews/reviews.repository", () => reviewRepoMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import { moderateReview } from "@/lib/reviews/review-moderation.service";

const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REVIEW_ID = "12121212-1212-4121-8121-121212121212";

const customer = makePublicUser({ role: "customer" });
const mechanic = makePublicUser({ role: "mechanic" });
const admin = makePublicUser({ role: "admin" });
const dispatcher = makePublicUser({ role: "dispatcher" });

function partProjection(overrides = {}) {
  return makeReviewProjectionRow({
    review_id: REVIEW_ID,
    target_type: "part",
    target_id: PART_ID,
    rating: 4,
    ...overrides,
  });
}

beforeEach(() => {
  resetFeedbackMocks();
  resetPartsMocks();
  resetRouteMocks();
  partStubs.partById = makePartRow({ part_id: PART_ID });
  feedbackStubs.ratingCounter = { total_score: 10, total_count: 3 };
  feedbackStubs.reviewProjection = partProjection();
});

describe("moderateReview authorization", () => {
  test("customers and mechanics cannot moderate", async () => {
    for (const actor of [customer, mechanic]) {
      const result = await moderateReview(actor, REVIEW_ID, {
        action: "hide",
        targetType: "part",
        targetId: PART_ID,
      });
      expect(result).toMatchObject({ ok: false, status: 403 });
    }
    expect(reviewRepoMocks.findReviewProjection.mock.calls.length).toBe(0);
  });
});

describe("moderateReview behavior", () => {
  test("hiding a part review un-counts it and refreshes the product rating", async () => {
    const result = await moderateReview(dispatcher, REVIEW_ID, {
      action: "hide",
      targetType: "part",
      targetId: PART_ID,
    });
    expect(result).toMatchObject({
      ok: true,
      data: { id: REVIEW_ID, hidden: true },
    });
    // Rating 4 hidden: counter moves -4/-1.
    expect(reviewRepoMocks.bumpRatingCounter.mock.calls[0]).toEqual([
      "part",
      PART_ID,
      -4,
      -1,
    ]);
    // Counter now reads 10-4=6 over 2 reviews; the row is flagged hidden.
    feedbackStubs.ratingCounter = { total_score: 6, total_count: 2 };
    feedbackStubs.reviewHidden = true;
    await moderateReview(admin, REVIEW_ID, {
      action: "unhide",
      targetType: "part",
      targetId: PART_ID,
    });
    expect(reviewRepoMocks.bumpRatingCounter.mock.calls[1]).toEqual([
      "part",
      PART_ID,
      4,
      1,
    ]);
    // Live refresh reaches product page viewers.
    const topics = realtimePublishMocks.publishRealtimeEvent.mock.calls.map(
      (call) => call[0],
    );
    expect(topics).toEqual([`part:${PART_ID}`, `part:${PART_ID}`]);
  });

  test("updatePartRating gets the recomputed counter values", async () => {
    feedbackStubs.reviewHidden = false;
    await moderateReview(admin, REVIEW_ID, {
      action: "hide",
      targetType: "part",
      targetId: PART_ID,
    });
    // refreshPartRating reads the stubbed counter (10/3) after the bump.
    expect(reviewRepoMocks.updatePartRating.mock.calls[0]?.[0]).toMatchObject({
      partId: PART_ID,
      ratingAvg: 3.3,
      ratingCount: 3,
    });
  });

  test("service/mechanic reviews toggle the flag without touching counters", async () => {
    feedbackStubs.reviewProjection = partProjection({
      target_type: "service",
      target_id: SERVICE_ID,
    });
    const result = await moderateReview(admin, REVIEW_ID, {
      action: "hide",
      targetType: "service",
      targetId: SERVICE_ID,
    });
    expect(result).toMatchObject({ ok: true, data: { hidden: true } });
    expect(reviewRepoMocks.bumpRatingCounter.mock.calls.length).toBe(0);
    expect(reviewRepoMocks.updatePartRating.mock.calls.length).toBe(0);
    // No part topic ping for non-part targets.
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("idempotent actions skip the writes but still succeed", async () => {
    feedbackStubs.reviewHidden = true;
    const result = await moderateReview(admin, REVIEW_ID, {
      action: "hide",
      targetType: "part",
      targetId: PART_ID,
    });
    expect(result).toMatchObject({ ok: true, data: { hidden: true } });
    expect(reviewRepoMocks.setTargetReviewHidden.mock.calls.length).toBe(0);
    expect(reviewRepoMocks.bumpRatingCounter.mock.calls.length).toBe(0);
    // Part topic still refreshes so moderator views re-sync.
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(1);
  });

  test("rejects bad ids, targets and actions", async () => {
    const cases: unknown[] = [
      { action: "hide", targetType: "part", targetId: PART_ID }, // bad id below
    ];
    expect(await moderateReview(admin, "not-a-uuid", cases[0])).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(
      await moderateReview(admin, REVIEW_ID, {
        action: "hide",
        targetType: "order",
        targetId: PART_ID,
      }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await moderateReview(admin, REVIEW_ID, {
        action: "nuke",
        targetType: "part",
        targetId: PART_ID,
      }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.findReviewProjection.mock.calls.length).toBe(0);
  });

  test("unknown reviews read as 404", async () => {
    feedbackStubs.reviewProjection = null;
    feedbackStubs.reviewProjectionScan = null;
    expect(
      await moderateReview(admin, REVIEW_ID, {
        action: "hide",
        targetType: "part",
        targetId: PART_ID,
      }),
    ).toMatchObject({ ok: false, status: 404 });
  });

  test("legacy rows resolve via partition scan and backfill reviews_by_id", async () => {
    feedbackStubs.reviewProjection = null;
    feedbackStubs.reviewProjectionScan = partProjection();
    const result = await moderateReview(dispatcher, REVIEW_ID, {
      action: "hide",
      targetType: "part",
      targetId: PART_ID,
    });
    expect(result).toMatchObject({ ok: true });
    expect(reviewRepoMocks.findTargetReviewRowById.mock.calls.length).toBe(1);
    expect(reviewRepoMocks.indexReviewProjection.mock.calls.length).toBe(1);
    expect(reviewRepoMocks.setTargetReviewHidden.mock.calls.length).toBe(1);
  });
});
