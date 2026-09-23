import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeOrderHistoryRow,
  makeOrderItemRow,
  makeOrderRow,
  makePartRow,
} from "../helpers/parts.fixtures";
import {
  orderDeliveryRepoMocks,
  orderRepoMocks,
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

import {
  cancelMyOrder,
  listStaffOrders,
  updateOrderStatus,
} from "@/lib/orders/orders.service";

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

  test("staff cancel restocks items", async () => {
    orderStubs.orderById = makeOrderRow({ status: "packing" });
    orderStubs.itemRows = [makeOrderItemRow({ quantity: 1 })];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    partStubs.partById = makePartRow({ stock_qty: 4, sold_count: 0 });
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "cancelled");
    expect(result.ok).toBe(true);
    const restockCall = partInventoryRepoMocks.setPartStock.mock.calls[0];
    expect(restockCall?.slice(0, 4)).toEqual([
      makePartItemRowId(),
      makePartRow().category_id,
      makePartRow().created_at,
      5,
    ]);
  });
});

describe("listStaffOrders", () => {
  test("rejects an unknown status filter", async () => {
    const result = await listStaffOrders({ status: "archived" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  test("rejects a malformed month bucket", async () => {
    const result = await listStaffOrders({
      status: "pending",
      month: "2026/01",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  test("pages one status partition and returns the encoded cursor", async () => {
    orderStubs.statusPage = {
      rows: [makeOrderRow()],
      pageState: "opaque-next",
    };
    const result = await listStaffOrders({
      status: "pending",
      month: "2026-01",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.id).toBe(ORDER_ID);
    expect(result.data.nextCursor).toBeTruthy();
    const listCall = orderRepoMocks.listOrderRowsByStatus.mock.calls[0];
    expect(listCall?.[0]).toBe("pending");
    expect(listCall?.[1]).toBe("2026-01");
    expect(listCall?.[3]).toBeNull();
  });

  test("rejects a foreign cursor scope", async () => {
    orderStubs.statusPage = { rows: [], pageState: "x" };
    const first = await listStaffOrders({ status: "pending" });
    if (!first.ok) throw new Error("expected ok");
    // Cursors are scoped: a token minted for another scope must not decode.
    const forged = `${first.data.nextCursor}-tampered`;
    const result = await listStaffOrders({
      status: "pending",
      cursor: forged,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });
});
