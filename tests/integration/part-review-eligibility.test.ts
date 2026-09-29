import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  feedbackStubs,
  makeOrderReviewRow,
  resetFeedbackMocks,
  reviewRepoMocks,
} from "../helpers/feedback.mocks";
import { makeOrderItemRow, makeOrderRow } from "../helpers/parts.fixtures";
import {
  orderRepoMocks,
  orderStubs,
  partRepoMocks,
  partStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";

mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module("@/lib/reviews/reviews.repository", () => reviewRepoMocks);

import {
  ELIGIBILITY_ORDER_SCAN,
  getPartReviewEligibility,
} from "@/lib/reviews/part-review-eligibility.service";

const CUSTOMER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const OTHER_ID = "99999999-9999-4999-8999-999999999999";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OTHER_PART_ID = "abababab-abab-4bab-8bab-abababababab";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const OLDER_ORDER_ID = "f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0";
const SLUG = "dau-nhot-10w-40";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });

function order(
  orderId: string,
  overrides?: Parameters<typeof makeOrderRow>[0],
) {
  return makeOrderRow({
    order_id: orderId,
    customer_id: CUSTOMER_ID,
    status: "delivered",
    ...overrides,
  });
}

beforeEach(() => {
  resetPartsMocks();
  resetFeedbackMocks();
  partStubs.partSlugOwner = PART_ID;
  orderStubs.ordersByCustomer = [order(ORDER_ID)];
  orderStubs.itemRows = [makeOrderItemRow({ part_id: PART_ID })];
});

describe("getPartReviewEligibility", () => {
  test("a delivered order with the part and no review is eligible", async () => {
    const result = await getPartReviewEligibility(customer, SLUG);
    expect(result).toEqual({
      ok: true,
      data: { status: "eligible", orderId: ORDER_ID, partId: PART_ID },
    });
    expect(orderRepoMocks.listOrderRowsByCustomer.mock.calls[0]).toEqual([
      CUSTOMER_ID,
      ELIGIBILITY_ORDER_SCAN,
    ]);
  });

  test("customers who never bought the part are not eligible", async () => {
    orderStubs.itemRows = [makeOrderItemRow({ part_id: OTHER_PART_ID })];
    const result = await getPartReviewEligibility(customer, SLUG);
    expect(result).toEqual({ ok: true, data: { status: "not_purchased" } });
    expect(reviewRepoMocks.listOrderPartReviewRows.mock.calls.length).toBe(0);
  });

  test("customers with no orders are not eligible", async () => {
    orderStubs.ordersByCustomer = [];
    const result = await getPartReviewEligibility(customer, SLUG);
    expect(result).toEqual({ ok: true, data: { status: "not_purchased" } });
  });

  test("orders that are not delivered never open the form", async () => {
    for (const status of ["pending", "shipping", "cancelled"]) {
      orderStubs.ordersByCustomer = [order(ORDER_ID, { status })];
      const result = await getPartReviewEligibility(customer, SLUG);
      expect(result).toEqual({ ok: true, data: { status: "not_purchased" } });
    }
    expect(orderRepoMocks.listOrderItemRows.mock.calls.length).toBe(0);
  });

  test("orders owned by someone else are ignored", async () => {
    orderStubs.ordersByCustomer = [order(ORDER_ID, { customer_id: OTHER_ID })];
    const result = await getPartReviewEligibility(customer, SLUG);
    expect(result).toEqual({ ok: true, data: { status: "not_purchased" } });
  });

  test("an already reviewed part reports the review instead", async () => {
    feedbackStubs.orderPartReviews = [
      { ...makeOrderReviewRow({ rating: 4, body: "Tot" }), part_id: PART_ID },
    ];
    const result = await getPartReviewEligibility(customer, SLUG);
    expect(result.ok).toBe(true);
    if (!result.ok || result.data.status !== "reviewed") {
      throw new Error("expected reviewed state");
    }
    expect(result.data.review).toMatchObject({ rating: 4, body: "Tot" });
  });

  test("a second delivered order with the part is still eligible", async () => {
    orderStubs.ordersByCustomer = [order(ORDER_ID), order(OLDER_ORDER_ID)];
    // Calls happen in order-list order: newest order reviewed, older open.
    reviewRepoMocks.listOrderPartReviewRows
      .mockImplementationOnce(async () => [
        { ...makeOrderReviewRow(), part_id: PART_ID },
      ])
      .mockImplementationOnce(async () => []);
    const result = await getPartReviewEligibility(customer, SLUG);
    expect(result).toEqual({
      ok: true,
      data: { status: "eligible", orderId: OLDER_ORDER_ID, partId: PART_ID },
    });
  });

  test("unknown or malformed slugs fail before any order read", async () => {
    partStubs.partSlugOwner = null;
    expect(await getPartReviewEligibility(customer, SLUG)).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await getPartReviewEligibility(customer, "   ")).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(await getPartReviewEligibility(customer, "%E0%A4%A")).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(orderRepoMocks.listOrderRowsByCustomer.mock.calls.length).toBe(0);
  });
});
