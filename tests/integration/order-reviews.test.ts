import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  feedbackStubs,
  makeOrderReviewRow,
  resetFeedbackMocks,
  reviewRepoMocks,
} from "../helpers/feedback.mocks";
import {
  makeOrderItemRow,
  makeOrderRow,
  makePartRow,
} from "../helpers/parts.fixtures";
import {
  orderRepoMocks,
  orderStubs,
  partRepoMocks,
  partStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";
import { realtimePublishMocks, resetRouteMocks } from "../helpers/route-mocks";
import {
  autoGrantServiceMocks,
  resetAutoRuleMocks,
} from "../helpers/voucher-auto.mocks";

mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module("@/lib/reviews/reviews.repository", () => reviewRepoMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);
mock.module("@/lib/vouchers/auto-grant.service", () => autoGrantServiceMocks);

import {
  createOrderPartReview,
  createOrderReview,
  getOrderReviews,
} from "@/lib/reviews/order-review.service";

const CUSTOMER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OTHER_ID = "99999999-9999-4999-8999-999999999999";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });

function deliveredOrder(overrides?: Parameters<typeof makeOrderRow>[0]) {
  return makeOrderRow({
    order_id: ORDER_ID,
    customer_id: CUSTOMER_ID,
    status: "delivered",
    ...overrides,
  });
}

function reviewBody(overrides?: Record<string, unknown>) {
  return { rating: 5, body: "Dich vu tot.", ...overrides };
}

beforeEach(() => {
  resetPartsMocks();
  resetFeedbackMocks();
  resetRouteMocks();
  resetAutoRuleMocks();
  orderStubs.orderById = deliveredOrder();
  orderStubs.itemRows = [makeOrderItemRow({ part_id: PART_ID })];
  partStubs.partById = makePartRow({ part_id: PART_ID });
  feedbackStubs.ratingCounter = { total_score: 14, total_count: 3 };
});

describe("createOrderReview guards", () => {
  test("rejects invalid order id before storage", async () => {
    const result = await createOrderReview(customer, "nope", reviewBody());
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimOrderReview.mock.calls.length).toBe(0);
  });

  test("rejects missing or foreign orders as 404", async () => {
    orderStubs.orderById = null;
    expect(
      await createOrderReview(customer, ORDER_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 404 });

    orderStubs.orderById = deliveredOrder({ customer_id: OTHER_ID });
    expect(
      await createOrderReview(customer, ORDER_ID, reviewBody()),
    ).toMatchObject({ ok: false, status: 404 });
    expect(reviewRepoMocks.claimOrderReview.mock.calls.length).toBe(0);
  });

  test("rejects orders that are not delivered", async () => {
    for (const status of ["pending", "shipping", "cancelled"]) {
      orderStubs.orderById = deliveredOrder({ status });
      expect(
        await createOrderReview(customer, ORDER_ID, reviewBody()),
      ).toMatchObject({ ok: false, status: 400 });
    }
    expect(reviewRepoMocks.claimOrderReview.mock.calls.length).toBe(0);
  });

  test("rejects invalid ratings and overlong bodies", async () => {
    for (const rating of [0, 6, "x", null]) {
      expect(
        await createOrderReview(customer, ORDER_ID, reviewBody({ rating })),
      ).toMatchObject({ ok: false, status: 400 });
    }
    expect(
      await createOrderReview(
        customer,
        ORDER_ID,
        reviewBody({ body: "x".repeat(1001) }),
      ),
    ).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimOrderReview.mock.calls.length).toBe(0);
  });
});

describe("createOrderReview writes", () => {
  test("claims and projects the review under the order target", async () => {
    const result = await createOrderReview(customer, ORDER_ID, reviewBody());
    expect(result.ok).toBe(true);
    expect(reviewRepoMocks.claimOrderReview.mock.calls.length).toBe(1);
    const projection = reviewRepoMocks.projectTargetReview.mock.calls[0]?.[0] as
      | { targetType: string; targetId: string; orderId: string }
      | undefined;
    expect(projection?.targetType).toBe("order");
    expect(projection?.targetId).toBe(ORDER_ID);
    // The loyalty hook keys the order-level review on the order ref.
    expect(autoGrantServiceMocks.handleVoucherReviewCreated.mock.calls).toEqual(
      [[CUSTOMER_ID, `order:${ORDER_ID}`]],
    );
  });

  test("an existing review returns 409 without writing", async () => {
    feedbackStubs.orderReview = makeOrderReviewRow();
    const result = await createOrderReview(customer, ORDER_ID, reviewBody());
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.claimOrderReview.mock.calls.length).toBe(0);
  });

  test("a lost claim returns 409", async () => {
    feedbackStubs.orderClaimApplied = false;
    const result = await createOrderReview(customer, ORDER_ID, reviewBody());
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.projectTargetReview.mock.calls.length).toBe(0);
  });
});

describe("createOrderPartReview", () => {
  test("rejects parts that are not inside the order", async () => {
    const result = await createOrderPartReview(
      customer,
      ORDER_ID,
      OTHER_ID,
      reviewBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimOrderPartReview.mock.calls.length).toBe(0);
  });

  test("rejects an already-reviewed part with 409", async () => {
    feedbackStubs.orderPartReviews = [
      { ...makeOrderReviewRow(), part_id: PART_ID },
    ];
    const result = await createOrderPartReview(
      customer,
      ORDER_ID,
      PART_ID,
      reviewBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.claimOrderPartReview.mock.calls.length).toBe(0);
  });

  test("projects under the part target and refreshes part rating", async () => {
    const result = await createOrderPartReview(
      customer,
      ORDER_ID,
      PART_ID,
      reviewBody({ rating: 4 }),
    );
    expect(result.ok).toBe(true);
    const projection = reviewRepoMocks.projectTargetReview.mock.calls[0]?.[0] as
      | { targetType: string; targetId: string; orderId: string }
      | undefined;
    expect(projection?.targetType).toBe("part");
    expect(projection?.targetId).toBe(PART_ID);
    expect(projection?.orderId).toBe(ORDER_ID);
    expect(reviewRepoMocks.bumpRatingCounter.mock.calls[0]).toEqual([
      "part",
      PART_ID,
      4,
    ]);
    // Stubbed counter reads 14/3 => 4.7 pushed onto the part rows.
    expect(reviewRepoMocks.updatePartRating.mock.calls[0]?.[0]).toMatchObject({
      partId: PART_ID,
      ratingAvg: 4.7,
      ratingCount: 3,
    });
    // Product-page viewers get a live refresh hint on the part topic.
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls).toEqual([
      [`part:${PART_ID}`, { kind: "review-created", partId: PART_ID }],
    ]);
    // Part reviews earn their own dedupe ref: one voucher per part review.
    expect(autoGrantServiceMocks.handleVoucherReviewCreated.mock.calls).toEqual(
      [[CUSTOMER_ID, `part:${ORDER_ID}:${PART_ID}`]],
    );
  });

  test("a lost part claim returns 409 without touching counters", async () => {
    feedbackStubs.partClaimApplied = false;
    const result = await createOrderPartReview(
      customer,
      ORDER_ID,
      PART_ID,
      reviewBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.projectTargetReview.mock.calls.length).toBe(0);
    expect(reviewRepoMocks.bumpRatingCounter.mock.calls.length).toBe(0);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });
});

describe("getOrderReviews", () => {
  test("returns the order review plus the per-part map", async () => {
    feedbackStubs.orderReview = makeOrderReviewRow({ rating: 4 });
    feedbackStubs.orderPartReviews = [
      { ...makeOrderReviewRow({ rating: 5 }), part_id: PART_ID },
    ];
    const result = await getOrderReviews(customer, ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.orderReview?.rating).toBe(4);
    expect(result.data.partReviews[PART_ID]?.rating).toBe(5);
  });

  test("foreign orders read as 404", async () => {
    orderStubs.orderById = deliveredOrder({ customer_id: OTHER_ID });
    const result = await getOrderReviews(customer, ORDER_ID);
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});
