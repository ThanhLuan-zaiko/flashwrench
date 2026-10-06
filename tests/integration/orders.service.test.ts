import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeOrderHistoryRow,
  makeOrderItemRow,
  makeOrderRow,
  makePartRow,
} from "../helpers/parts.fixtures";
import { paymentPromptRepoMocks } from "../helpers/payment.mocks";
import {
  autoGrantServiceMocks,
  autoGrantStubs,
  orderDeliveryRepoMocks,
  orderRepoMocks,
  orderRevenueMocks,
  orderStubs,
  orderWriteRepoMocks,
  partInventoryRepoMocks,
  partRepoMocks,
  partStubs,
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
mock.module("@/lib/orders/order-revenue", () => orderRevenueMocks);
mock.module("@/lib/vouchers/auto-grant.service", () => autoGrantServiceMocks);
mock.module(
  "@/lib/payments/payment-prompt.repository",
  () => paymentPromptRepoMocks,
);

import { cancelMyOrder, updateOrderStatus } from "@/lib/orders/orders.service";

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

beforeEach(() => {
  resetServiceMocks();
});

describe("cancelMyOrder", () => {
  test("404 when the order does not exist", async () => {
    orderStubs.orderById = null;
    const result = await cancelMyOrder(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  test("403 when the order belongs to someone else", async () => {
    orderStubs.orderById = makeOrderRow({ customer_id: "other-customer" });
    const result = await cancelMyOrder(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("400 once the order left pending, leaving storage untouched", async () => {
    orderStubs.orderById = makeOrderRow({ status: "confirmed" });
    const result = await cancelMyOrder(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
    expect(partInventoryRepoMocks.setPartStock).not.toHaveBeenCalled();
  });

  test("cancels a pending order and restocks its items", async () => {
    orderStubs.orderById = makeOrderRow({ status: "pending" });
    orderStubs.itemRows = [makeOrderItemRow({ quantity: 2 })];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 8, sold_count: 5 });

    const result = await cancelMyOrder(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(true);
    const statusCall = orderWriteRepoMocks.updateOrderStatusRows.mock
      .calls[0]?.[0] as {
      newStatus: string;
    } | null;
    expect(statusCall?.newStatus).toBe("cancelled");
    expect(orderWriteRepoMocks.insertOrderHistory).toHaveBeenCalled();
    // Restock: 8 + 2 = 10, sold_count floored at 0 → 5 - 2 = 3.
    const restockCall = partInventoryRepoMocks.setPartStock.mock.calls[0];
    expect(restockCall?.slice(0, 4)).toEqual([
      makePartItemRowId(),
      makePartRow().category_id,
      makePartRow().created_at,
      10,
    ]);
    expect(partInventoryRepoMocks.setPartSoldCount.mock.calls[0]).toEqual([
      makePartItemRowId(),
      3,
    ]);
  });

  test("cancelling a mock-paid order flips its payments to refunded", async () => {
    orderStubs.orderById = makeOrderRow({
      status: "pending",
      payment_status: "paid",
      payment_method: "bank_transfer",
    });
    orderStubs.itemRows = [makeOrderItemRow({ quantity: 1 })];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 4, sold_count: 1 });

    const result = await cancelMyOrder(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(true);
    const paymentCall = orderDeliveryRepoMocks.markOrderPaymentStatus.mock
      .calls[0]?.[0] as { paymentStatus: string; paidAt: Date | null } | null;
    expect(paymentCall?.paymentStatus).toBe("refunded");
    expect(paymentCall?.paidAt).toBeNull();
    // Stock still comes back — refunding does not skip the restock.
    expect(partInventoryRepoMocks.setPartStock).toHaveBeenCalled();
  });

  test("cancelling an unpaid order leaves payments untouched", async () => {
    orderStubs.orderById = makeOrderRow({
      status: "pending",
      payment_status: "unpaid",
    });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 4, sold_count: 0 });

    const result = await cancelMyOrder(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(true);
    expect(
      orderDeliveryRepoMocks.markOrderPaymentStatus,
    ).not.toHaveBeenCalled();
  });
});

function makePartItemRowId(): string {
  return "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
}

describe("updateOrderStatus", () => {
  test("rejects an unknown target status", async () => {
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "archived");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.status).toBeTruthy();
    expect(orderRepoMocks.findOrderRowById).not.toHaveBeenCalled();
  });

  test("blocks illegal jumps without writing", async () => {
    orderStubs.orderById = makeOrderRow({ status: "pending" });
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "shipping");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("blocks the no-op self transition", async () => {
    orderStubs.orderById = makeOrderRow({ status: "confirmed" });
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "confirmed");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  test("dispatchers cannot refund; admins can", async () => {
    orderStubs.orderById = makeOrderRow({ status: "delivered" });
    const denied = await updateOrderStatus(DISPATCHER, ORDER_ID, "refunded");
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.status).toBe(403);
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();

    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    const allowed = await updateOrderStatus(ADMIN, ORDER_ID, "refunded");
    expect(allowed.ok).toBe(true);
    const statusCall = orderWriteRepoMocks.updateOrderStatusRows.mock
      .calls[0]?.[0] as {
      newStatus: string;
    } | null;
    expect(statusCall?.newStatus).toBe("refunded");
    // Refund is not a restock transition.
    expect(partInventoryRepoMocks.setPartStock).not.toHaveBeenCalled();
    // The refund hook unwinds the customer's loyalty rollup.
    const refundCalls =
      autoGrantServiceMocks.handleVoucherOrderTransition.mock.calls;
    expect(refundCalls).toHaveLength(1);
    expect(refundCalls[0]?.[0]).toMatchObject({
      customer_id: CUSTOMER,
      order_id: ORDER_ID,
      total: 270000,
    });
    expect(refundCalls[0]?.[1]).toBe("refunded");
  });

  test("delivered orders fire the loyalty hook; a throwing hook is absorbed", async () => {
    orderStubs.orderById = makeOrderRow({ status: "shipping" });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];

    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "delivered");
    expect(result.ok).toBe(true);
    const deliveredCalls =
      autoGrantServiceMocks.handleVoucherOrderTransition.mock.calls;
    expect(deliveredCalls).toHaveLength(1);
    expect(deliveredCalls[0]?.[0]).toMatchObject({
      customer_id: CUSTOMER,
      order_id: ORDER_ID,
      total: 270000,
    });
    expect(deliveredCalls[0]?.[1]).toBe("delivered");

    // Automation is best-effort: a throwing handler must not fail the
    // status transition itself.
    autoGrantStubs.throws = true;
    orderStubs.orderById = makeOrderRow({ status: "shipping" });
    const again = await updateOrderStatus(DISPATCHER, ORDER_ID, "delivered");
    expect(again.ok).toBe(true);
  });

  test("walks a pending order to confirmed with history", async () => {
    orderStubs.orderById = makeOrderRow({ status: "pending" });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    const result = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "confirmed",
      "Khach xac nhan qua dien thoai",
    );
    expect(result.ok).toBe(true);
    const statusCall = orderWriteRepoMocks.updateOrderStatusRows.mock
      .calls[0]?.[0] as {
      oldStatus: string;
      newStatus: string;
    } | null;
    expect(statusCall?.oldStatus).toBe("pending");
    expect(statusCall?.newStatus).toBe("confirmed");
    const historyCall = orderWriteRepoMocks.insertOrderHistory.mock
      .calls[0]?.[0] as {
      newStatus: string;
    } | null;
    expect(historyCall?.newStatus).toBe("confirmed");
  });

  test("staff cancel without a reason writes no rows", async () => {
    orderStubs.orderById = makeOrderRow({ status: "confirmed" });
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "cancelled");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.note).toBeTruthy();
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
    expect(partInventoryRepoMocks.setPartStock).not.toHaveBeenCalled();
  });

  test("staff cancel restocks items and echoes the reason to history", async () => {
    orderStubs.orderById = makeOrderRow({ status: "packing" });
    orderStubs.itemRows = [makeOrderItemRow({ quantity: 1 })];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 4, sold_count: 0 });
    const result = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "cancelled",
      "Khach bao doi y, khong mua nua",
    );
    expect(result.ok).toBe(true);
    const historyCall = orderWriteRepoMocks.insertOrderHistory.mock
      .calls[0]?.[0] as { note: string } | null;
    expect(historyCall?.note).toBe("Khach bao doi y, khong mua nua");
    const restockCall = partInventoryRepoMocks.setPartStock.mock.calls[0];
    expect(restockCall?.slice(0, 4)).toEqual([
      makePartItemRowId(),
      makePartRow().category_id,
      makePartRow().created_at,
      5,
    ]);
  });
});
