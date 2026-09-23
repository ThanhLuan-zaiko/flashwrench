import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  makeOrderHistoryRow,
  makeOrderItemRow,
  makeOrderRow,
} from "../helpers/parts.fixtures";
import {
  orderDeliveryRepoMocks,
  orderDeliveryStubs,
  orderRepoMocks,
  orderStubs,
  orderWriteRepoMocks,
  partInventoryRepoMocks,
  partRepoMocks,
  partsMediaServiceMocks,
  resetServiceMocks,
  serviceStubs,
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

import { updateOrderStatus } from "@/lib/orders/orders.service";

const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const MECHANIC_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DISPATCHER = {
  id: "d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1",
  role: "dispatcher" as const,
};
const ADMIN = {
  id: "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1",
  role: "admin" as const,
};

function packingOrder(overrides = {}) {
  orderStubs.orderById = makeOrderRow({ status: "packing", ...overrides });
  orderStubs.itemRows = [makeOrderItemRow()];
  orderStubs.historyRows = [makeOrderHistoryRow()];
}

beforeEach(() => {
  resetServiceMocks();
});

describe("updateOrderStatus courier assignment", () => {
  test("shipping requires a courier choice", async () => {
    packingOrder();
    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "shipping");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.courier).toBeTruthy();
    expect(orderWriteRepoMocks.updateOrderStatusRows).not.toHaveBeenCalled();
  });

  test("mechanic courier needs a valid active mechanic", async () => {
    packingOrder();
    const badId = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "shipping",
      "",
      { type: "mechanic", mechanicId: "not-a-uuid" },
    );
    expect(badId.ok).toBe(false);
    if (badId.ok) return;
    expect(badId.errors.mechanicId).toBeTruthy();

    serviceStubs.userById = makeUserRow({
      user_id: MECHANIC_ID,
      role: "customer",
    });
    const wrongRole = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "shipping",
      "",
      { type: "mechanic", mechanicId: MECHANIC_ID },
    );
    expect(wrongRole.ok).toBe(false);
    if (wrongRole.ok) return;
    expect(wrongRole.errors.mechanicId).toBeTruthy();
    expect(orderDeliveryRepoMocks.assignOrderCourier).not.toHaveBeenCalled();
  });

  test("assigns a mechanic courier and writes the courier board row", async () => {
    packingOrder();
    serviceStubs.userById = makeUserRow({
      user_id: MECHANIC_ID,
      role: "mechanic",
      status: "active",
      full_name: "Tho Giao Hang",
    });
    const result = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "shipping",
      "",
      { type: "mechanic", mechanicId: MECHANIC_ID },
    );
    expect(result.ok).toBe(true);
    const assign = orderDeliveryRepoMocks.assignOrderCourier.mock.calls[0]?.at(
      0,
    ) as {
      courierType: string;
      courierId: string | null;
      courierName: string | null;
      trackingCode: string | null;
    } | null;
    expect(assign).toMatchObject({
      courierType: "mechanic",
      courierId: MECHANIC_ID,
      courierName: "Tho Giao Hang",
      trackingCode: null,
    });
    expect(orderWriteRepoMocks.updateOrderStatusRows).toHaveBeenCalled();
  });

  test("third-party courier needs a carrier name and tracking code", async () => {
    packingOrder();
    const noName = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "shipping",
      "",
      { type: "third_party", trackingCode: "VN123456" },
    );
    expect(noName.ok).toBe(false);
    if (noName.ok) return;
    expect(noName.errors.carrierName).toBeTruthy();

    const noCode = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "shipping",
      "",
      { type: "third_party", carrierName: "GiaoHangNhanh" },
    );
    expect(noCode.ok).toBe(false);
    if (noCode.ok) return;
    expect(noCode.errors.trackingCode).toBeTruthy();
    expect(orderDeliveryRepoMocks.assignOrderCourier).not.toHaveBeenCalled();
  });

  test("stores carrier name + tracking code for third-party shipping", async () => {
    packingOrder();
    const result = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "shipping",
      "",
      {
        type: "third_party",
        carrierName: "  Giao  Hang  Nhanh ",
        trackingCode: " GHN-778899 ",
      },
    );
    expect(result.ok).toBe(true);
    const assign = orderDeliveryRepoMocks.assignOrderCourier.mock.calls[0]?.at(
      0,
    ) as {
      courierType: string;
      courierId: string | null;
      courierName: string | null;
      trackingCode: string | null;
    } | null;
    expect(assign).toMatchObject({
      courierType: "third_party",
      courierId: null,
      courierName: "Giao Hang Nhanh",
      trackingCode: "GHN-778899",
    });
  });

  test("pickup orders cannot ship but hand over directly at packing", async () => {
    packingOrder({ fulfillment_type: "pickup" });
    const shipped = await updateOrderStatus(
      DISPATCHER,
      ORDER_ID,
      "shipping",
      "",
      { type: "third_party", carrierName: "GHN", trackingCode: "VN123" },
    );
    expect(shipped.ok).toBe(false);
    if (shipped.ok) return;
    expect(shipped.status).toBe(400);
    expect(orderDeliveryRepoMocks.assignOrderCourier).not.toHaveBeenCalled();

    const handed = await updateOrderStatus(DISPATCHER, ORDER_ID, "delivered");
    expect(handed.ok).toBe(true);
  });
});

describe("payment settlement on delivered/refunded", () => {
  test("delivered marks the order and its payment rows paid", async () => {
    orderStubs.orderById = makeOrderRow({
      status: "shipping",
      courier_type: "mechanic",
      courier_id: MECHANIC_ID,
    });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    orderDeliveryStubs.paymentRefs = [
      { paymentId: "p1", createdAt: new Date("2026-01-05T00:00:00.000Z") },
    ];

    const result = await updateOrderStatus(DISPATCHER, ORDER_ID, "delivered");
    expect(result.ok).toBe(true);
    const payment =
      orderDeliveryRepoMocks.markOrderPaymentStatus.mock.calls[0]?.at(0) as {
        paymentStatus: string;
        paidAt: Date | null;
        paymentRefs: { paymentId: string }[];
      } | null;
    expect(payment?.paymentStatus).toBe("paid");
    expect(payment?.paidAt).toBeInstanceOf(Date);
    expect(payment?.paymentRefs).toHaveLength(1);
    // The courier board row follows the order to delivered.
    const courier =
      orderDeliveryRepoMocks.updateOrderCourierStatus.mock.calls[0]?.at(0) as {
        status: string;
      } | null;
    expect(courier?.status).toBe("delivered");
  });

  test("refunded flips payments to refunded", async () => {
    orderStubs.orderById = makeOrderRow({ status: "delivered" });
    orderStubs.itemRows = [makeOrderItemRow()];
    orderStubs.historyRows = [makeOrderHistoryRow()];
    const result = await updateOrderStatus(ADMIN, ORDER_ID, "refunded");
    expect(result.ok).toBe(true);
    const payment =
      orderDeliveryRepoMocks.markOrderPaymentStatus.mock.calls[0]?.at(0) as {
        paymentStatus: string;
        paidAt: Date | null;
      } | null;
    expect(payment?.paymentStatus).toBe("refunded");
    expect(payment?.paidAt).toBeNull();
  });
});
