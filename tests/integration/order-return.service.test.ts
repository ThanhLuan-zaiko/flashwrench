import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeOrderHistoryRow,
  makeOrderItemRow,
  makeOrderRow,
} from "../helpers/parts.fixtures";
import {
  orderDeliveryRepoMocks,
  orderRepoMocks,
  orderStubs,
  orderWriteRepoMocks,
  partInventoryRepoMocks,
  partRepoMocks,
  partsMediaServiceMocks,
  resetServiceMocks,
  userRepoMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module(
  "@/lib/parts/parts-inventory.repository",
  () => partInventoryRepoMocks,
);
mock.module("@/lib/media/media.service", () => partsMediaServiceMocks);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/orders/orders-write.repository", () => orderWriteRepoMocks);
mock.module(
  "@/lib/orders/orders-delivery.repository",
  () => orderDeliveryRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);

import { requestOrderReturn } from "@/lib/orders/order-return.service";
import { updateOrderStatus } from "@/lib/orders/orders.service";

const CUSTOMER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const DISPATCHER = {
  id: "d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1",
  role: "dispatcher" as const,
};
const ADMIN = {
  id: "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1",
  role: "admin" as const,
};
const VALID_INPUT = {
  reason: "Bugi bi mop dau, khong lap duoc",
  images: ["/api/media/return/2026-02/evidence.jpg"],
};

function deliveredInsideWindow() {
  orderStubs.orderById = makeOrderRow({ status: "delivered" });
  orderStubs.itemRows = [makeOrderItemRow()];
  orderStubs.historyRows = [
    makeOrderHistoryRow({
      new_status: "delivered",
      changed_at: new Date(Date.now() - 60_000),
    }),
  ];
}

beforeEach(() => {
  resetServiceMocks();
});

describe("requestOrderReturn", () => {
  test("404 for a malformed or unknown order id", async () => {
    expect((await requestOrderReturn(CUSTOMER, "no", VALID_INPUT)).ok).toBe(
      false,
    );
    orderStubs.orderById = null;
    const result = await requestOrderReturn(CUSTOMER, ORDER_ID, VALID_INPUT);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(orderRepoMocks.findOrderRowById).toHaveBeenCalled();
  });

  test("403 when the order belongs to someone else", async () => {
    deliveredInsideWindow();
    orderStubs.orderById = makeOrderRow({
      status: "delivered",
      customer_id: "other-customer",
    });
    const result = await requestOrderReturn(CUSTOMER, ORDER_ID, VALID_INPUT);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("400 when the order was not delivered yet", async () => {
    orderStubs.orderById = makeOrderRow({ status: "packing" });
    const result = await requestOrderReturn(CUSTOMER, ORDER_ID, VALID_INPUT);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("400 once the 3-day window closed", async () => {
    orderStubs.orderById = makeOrderRow({ status: "delivered" });
    orderStubs.historyRows = [
      makeOrderHistoryRow({
        new_status: "delivered",
        changed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      }),
    ];
    const result = await requestOrderReturn(CUSTOMER, ORDER_ID, VALID_INPUT);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.saveOrderReturnRequest).not.toHaveBeenCalled();
  });

  test("400 with field errors when reason or photos are missing", async () => {
    deliveredInsideWindow();
    const result = await requestOrderReturn(CUSTOMER, ORDER_ID, {
      reason: " ",
      images: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.reason).toBeTruthy();
    expect(result.errors.images).toBeTruthy();
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("400 when a photo URL does not come from the media store", async () => {
    deliveredInsideWindow();
    const result = await requestOrderReturn(CUSTOMER, ORDER_ID, {
      reason: "Loi san pham",
      images: ["https://evil.example/fake.jpg"],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.images).toBeTruthy();
  });

  test("files the request and moves the order to the review queue", async () => {
    deliveredInsideWindow();
    const result = await requestOrderReturn(CUSTOMER, ORDER_ID, VALID_INPUT);
    expect(result.ok).toBe(true);
    const statusCall = orderWriteRepoMocks.updateOrderStatusRows.mock
      .calls[0]?.[0] as { oldStatus: string; newStatus: string } | null;
    expect(statusCall?.oldStatus).toBe("delivered");
    expect(statusCall?.newStatus).toBe("return_requested");
    const requestCall = orderWriteRepoMocks.saveOrderReturnRequest.mock
      .calls[0]?.[0] as { reason: string; images: string[] } | null;
    expect(requestCall?.reason).toBe(VALID_INPUT.reason);
    expect(requestCall?.images).toEqual(VALID_INPUT.images);
    const historyCall = orderWriteRepoMocks.insertOrderHistory.mock
      .calls[0]?.[0] as { changedBy: string } | null;
    expect(historyCall?.changedBy).toBe(CUSTOMER);
  });
});

// Staff review of a queued request, via the shared updateOrderStatus path.
describe("return request decisions", () => {
  function queuedRequest() {
    orderStubs.orderById = makeOrderRow({
      status: "return_requested",
      return_reason: "Loi san pham",
    });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
  }

  test("rejecting needs a note and writes no rows", async () => {
    queuedRequest();
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "delivered");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.note).toBeTruthy();
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
    expect(orderWriteRepoMocks.saveOrderReturnDecision).not.toHaveBeenCalled();
  });

  test("rejecting stores the rejection and note, order goes back paid", async () => {
    queuedRequest();
    const result = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "delivered",
      "Anh mo ta khong dung loi",
    );
    expect(result.ok).toBe(true);
    const decision = orderWriteRepoMocks.saveOrderReturnDecision.mock
      .calls[0]?.[0] as { decision: string; note: string } | null;
    expect(decision?.decision).toBe("rejected");
    expect(decision?.note).toBe("Anh mo ta khong dung loi");
    // Back on the delivered shelf re-settles the payment like any handover.
    const paymentCall = orderDeliveryRepoMocks.markOrderPaymentStatus.mock
      .calls[0]?.[0] as { paymentStatus: string } | null;
    expect(paymentCall?.paymentStatus).toBe("paid");
  });

  test("any staff can approve a request into refunded", async () => {
    queuedRequest();
    orderStubs.orderById = makeOrderRow({
      status: "return_requested",
      payment_status: "paid",
      payment_method: "bank_transfer",
      return_reason: "Loi san pham",
    });
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "refunded");
    expect(result.ok).toBe(true);
    const decision = orderWriteRepoMocks.saveOrderReturnDecision.mock
      .calls[0]?.[0] as { decision: string; decidedBy: string } | null;
    expect(decision?.decision).toBe("approved");
    expect(decision?.decidedBy).toBe(DISPATCHER.id);
    const paymentCall = orderDeliveryRepoMocks.markOrderPaymentStatus.mock
      .calls[0]?.[0] as { paymentStatus: string } | null;
    expect(paymentCall?.paymentStatus).toBe("refunded");
    // Refunding never restocks automatically.
    expect(partInventoryRepoMocks.setPartStock).not.toHaveBeenCalled();
  });

  test("only admins refund a delivered order without a request", async () => {
    orderStubs.orderById = makeOrderRow({ status: "delivered" });
    const denied = await updateOrderStatus(DISPATCHER, ORDER_ID, "refunded");
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.status).toBe(403);
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    const allowed = await updateOrderStatus(ADMIN, ORDER_ID, "refunded");
    expect(allowed.ok).toBe(true);
  });
});
