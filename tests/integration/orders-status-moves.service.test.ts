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

describe("order status claims and restock", () => {
  test("409 with no side effects when a racing move claimed the order first", async () => {
    orderStubs.orderById = makeOrderRow({ status: "pending" });
    orderStubs.itemRows = [makeOrderItemRow({ quantity: 2 })];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 8, sold_count: 5 });
    orderWriteRepoMocks.updateOrderStatusRows.mockImplementationOnce(
      async () => false,
    );

    const result = await cancelMyOrder(CUSTOMER, ORDER_ID);
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(orderWriteRepoMocks.insertOrderHistory).not.toHaveBeenCalled();
    expect(partInventoryRepoMocks.restockPartStockCas).not.toHaveBeenCalled();
    expect(partInventoryRepoMocks.setPartSoldCount).not.toHaveBeenCalled();
  });

  test("a refund restocks only when staff confirmed the goods came back", async () => {
    orderStubs.orderById = makeOrderRow({ status: "delivered" });
    orderStubs.itemRows = [makeOrderItemRow({ quantity: 2 })];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 8, sold_count: 5 });

    const result = await updateOrderStatus(
      ADMIN,
      ORDER_ID,
      "refunded",
      "Hang con nguyen",
      undefined,
      { restockReturned: true },
    );
    expect(result.ok).toBe(true);
    const restockCall = partInventoryRepoMocks.restockPartStockCas.mock
      .calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(restockCall).toMatchObject({
      partId: makePartItemRowId(),
      expectedQty: 8,
      newQty: 10,
    });
    expect(partInventoryRepoMocks.setPartSoldCount.mock.calls[0]).toEqual([
      makePartItemRowId(),
      3,
    ]);
  });

  test("staff move that loses the claim answers 409 and writes nothing", async () => {
    orderStubs.orderById = makeOrderRow({ status: "packing" });
    orderStubs.itemRows = [makeOrderItemRow({ quantity: 1 })];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 4, sold_count: 0 });
    orderWriteRepoMocks.updateOrderStatusRows.mockImplementationOnce(
      async () => false,
    );

    const result = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "cancelled",
      "Khach huy",
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(orderWriteRepoMocks.insertOrderHistory).not.toHaveBeenCalled();
    expect(partInventoryRepoMocks.restockPartStockCas).not.toHaveBeenCalled();
  });
});

function makePartItemRowId(): string {
  return "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
}
