import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  feedbackStubs,
  makeRescueReviewRow,
  resetFeedbackMocks,
  reviewRepoMocks,
} from "../helpers/feedback.mocks";
import {
  makeRescueRow,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";
import {
  autoGrantServiceMocks,
  resetAutoRuleMocks,
} from "../helpers/voucher-auto.mocks";
import {
  domainPublishMocks,
  resetWorkspaceMocks,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/reviews/reviews.repository", () => reviewRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);
mock.module("@/lib/vouchers/auto-grant.service", () => autoGrantServiceMocks);

import {
  createRescueReview,
  getRescueReview,
} from "@/lib/reviews/rescue-review.service";

const CUSTOMER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const MECHANIC_ID = "56565656-5656-4565-8565-565656565656";
const REQUEST_ID = "abababab-abab-4bab-8bab-abababababab";
const OTHER_ID = "99999999-9999-4999-8999-999999999999";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });

function completedRescue(overrides?: Parameters<typeof makeRescueRow>[0]) {
  return makeRescueRow({
    request_id: REQUEST_ID,
    customer_id: CUSTOMER_ID,
    status: "completed",
    assigned_mechanic_id: MECHANIC_ID,
    ...overrides,
  });
}

function reviewBody(overrides?: Record<string, unknown>) {
  return { rating: 5, body: "Den rat nhanh.", ...overrides };
}

beforeEach(() => {
  resetRescueMocks();
  resetFeedbackMocks();
  resetWorkspaceMocks();
  resetAutoRuleMocks();
  rescueStubs.rowById = completedRescue();
});

describe("createRescueReview guards", () => {
  test("rejects invalid request ids", async () => {
    const result = await createRescueReview(customer, "nope", reviewBody());
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimRescueReview.mock.calls.length).toBe(0);
  });

  test("missing or foreign requests read as 404", async () => {
    rescueStubs.rowById = null;
    expect(
      await createRescueReview(customer, REQUEST_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 404 });

    rescueStubs.rowById = completedRescue({ customer_id: OTHER_ID });
    expect(
      await createRescueReview(customer, REQUEST_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 404 });
    expect(reviewRepoMocks.claimRescueReview.mock.calls.length).toBe(0);
  });

  test("only completed rescues with an assigned mechanic qualify", async () => {
    rescueStubs.rowById = completedRescue({ status: "en_route" });
    expect(
      await createRescueReview(customer, REQUEST_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 400 });

    rescueStubs.rowById = completedRescue({ assigned_mechanic_id: null });
    expect(
      await createRescueReview(customer, REQUEST_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimRescueReview.mock.calls.length).toBe(0);
  });

  test("rejects invalid ratings and non-string bodies", async () => {
    for (const rating of [0, 6, "x", 2.5]) {
      expect(
        await createRescueReview(customer, REQUEST_ID, reviewBody({ rating })),
      ).toMatchObject({ ok: false, status: 400 });
    }
    expect(
      await createRescueReview(customer, REQUEST_ID, reviewBody({ body: 12 })),
    ).toMatchObject({ ok: false, status: 400 });
  });
});

describe("createRescueReview writes", () => {
  test("projects onto the mechanic target and publishes rescue-updated", async () => {
    const result = await createRescueReview(customer, REQUEST_ID, reviewBody());
    expect(result.ok).toBe(true);
    expect(reviewRepoMocks.claimRescueReview.mock.calls.length).toBe(1);
    const projection = reviewRepoMocks.projectTargetReview.mock.calls[0]?.[0] as
      | { targetType: string; targetId: string; rescueId: string }
      | undefined;
    expect(projection?.targetType).toBe("mechanic");
    expect(projection?.targetId).toBe(MECHANIC_ID);
    expect(projection?.rescueId).toBe(REQUEST_ID);
    // Mechanic ratings aggregate from reviews_by_target — never counters.
    expect(reviewRepoMocks.bumpRatingCounter.mock.calls.length).toBe(0);
    expect(domainPublishMocks.publishRescueChange.mock.calls[0]?.[0]).toBe(
      "rescue-updated",
    );
    // Rescue reviews join the same voucher hook, keyed on the request id.
    expect(autoGrantServiceMocks.handleVoucherReviewCreated.mock.calls).toEqual(
      [[CUSTOMER_ID, `rescue:${REQUEST_ID}`]],
    );
  });

  test("an existing review returns 409 without writing", async () => {
    feedbackStubs.rescueReview = makeRescueReviewRow();
    const result = await createRescueReview(customer, REQUEST_ID, reviewBody());
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.claimRescueReview.mock.calls.length).toBe(0);
    expect(reviewRepoMocks.projectTargetReview.mock.calls.length).toBe(0);
  });

  test("a lost claim returns 409", async () => {
    feedbackStubs.rescueClaimApplied = false;
    const result = await createRescueReview(customer, REQUEST_ID, reviewBody());
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.projectTargetReview.mock.calls.length).toBe(0);
  });
});

describe("getRescueReview", () => {
  test("returns the stored review for the owner", async () => {
    feedbackStubs.rescueReview = makeRescueReviewRow({ rating: 4 });
    const result = await getRescueReview(customer, REQUEST_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.review?.rating).toBe(4);
  });

  test("foreign requests read as 404 even when a review exists", async () => {
    rescueStubs.rowById = completedRescue({ customer_id: OTHER_ID });
    feedbackStubs.rescueReview = makeRescueReviewRow();
    const result = await getRescueReview(customer, REQUEST_ID);
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});
