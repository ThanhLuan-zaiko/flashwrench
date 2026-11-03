import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeOrderRow } from "../helpers/parts.fixtures";
import {
  autoGrantServiceMocks,
  orderDeliveryRepoMocks,
  orderRepoMocks,
  orderRevenueMocks,
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
mock.module("@/lib/orders/order-revenue", () => orderRevenueMocks);
mock.module("@/lib/vouchers/auto-grant.service", () => autoGrantServiceMocks);

import { listStaffOrders } from "@/lib/orders/orders.service";

const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

beforeEach(() => {
  resetServiceMocks();
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

  test("search keeps only orders whose customer matches", async () => {
    orderStubs.statusPage = {
      rows: [
        makeOrderRow({
          order_id: "11111111-1111-4111-8111-111111111111",
          customer_name: "Nguyễn Văn An",
        }),
        makeOrderRow({
          order_id: "22222222-2222-4222-8222-222222222222",
          customer_name: "Trần Thị Bình",
        }),
      ],
      pageState: null,
    };
    const result = await listStaffOrders({
      status: "pending",
      month: "2026-01",
      search: "TRAN thi",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items.map((item) => item.id)).toEqual([
      "22222222-2222-4222-8222-222222222222",
    ]);
    expect(result.data.items[0]?.customerName).toBe("Trần Thị Bình");
  });

  test("search walks later pages until a match fills the board", async () => {
    orderRepoMocks.listOrderRowsByStatus
      .mockImplementationOnce(async () => ({
        rows: [
          makeOrderRow({
            order_id: "33333333-3333-4333-8333-333333333333",
            customer_name: "Lê Văn Cường",
          }),
        ],
        pageState: "page-2",
      }))
      .mockImplementationOnce(async () => ({
        rows: [
          makeOrderRow({
            order_id: "44444444-4444-4444-8444-444444444444",
            customer_name: "Trần Thị Bình",
          }),
        ],
        pageState: null,
      }));
    const result = await listStaffOrders({
      status: "pending",
      month: "2026-01",
      search: "tran",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items.map((item) => item.id)).toEqual([
      "44444444-4444-4444-8444-444444444444",
    ]);
    expect(orderRepoMocks.listOrderRowsByStatus.mock.calls).toHaveLength(2);
  });
});
