import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  MECHANIC_ID,
  makeLocationRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { makeOrderRow } from "../helpers/parts.fixtures";
import {
  orderDeliveryRepoMocks,
  orderDeliveryStubs,
  orderRepoMocks,
  orderStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";
import {
  bookingTravelRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Helpers first, mocks second, system under test last.
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/booking/booking-travel.repository",
  () => bookingTravelRepoMocks,
);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module(
  "@/lib/orders/orders-delivery.repository",
  () => orderDeliveryRepoMocks,
);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import {
  getNavigationBoard,
  saveMechanicLocation,
} from "@/lib/mechanic/mechanic-navigation.service";

const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  resetPartsMocks();
});

describe("saveMechanicLocation order jobs", () => {
  test("records an order travel point while the order is shipping", async () => {
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      status: "shipping",
      courier_type: "mechanic",
      courier_id: MECHANIC_ID,
    });
    const result = await saveMechanicLocation(MECHANIC_ID, {
      latitude: 10.775,
      longitude: 106.701,
      currentJobId: ORDER_ID,
      currentJobType: "order",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.currentJobType).toBe("order");
    expect(orderDeliveryStubs.insertedTravelPoints).toHaveLength(1);
    expect(orderDeliveryStubs.insertedTravelPoints[0]).toMatchObject({
      orderId: ORDER_ID,
      courierId: MECHANIC_ID,
      lat: 10.775,
      lng: 106.701,
    });
    // Booking breadcrumbs stay untouched for delivery jobs.
    expect(workspaceStubs.insertedTravelPoints).toEqual([]);
  });

  test("rejects order jobs the mechanic does not carry", async () => {
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      status: "shipping",
      courier_type: "mechanic",
      courier_id: "99999999-9999-4999-8999-999999999999",
    });
    const result = await saveMechanicLocation(MECHANIC_ID, {
      latitude: 10.775,
      longitude: 106.701,
      currentJobId: ORDER_ID,
      currentJobType: "order",
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(
      mechanicWorkspaceRepoMocks.upsertMechanicLocation.mock.calls.length,
    ).toBe(0);
    expect(orderDeliveryStubs.insertedTravelPoints).toEqual([]);
  });

  test("rejects a non-shipping order without writing breadcrumbs", async () => {
    orderStubs.orderById = makeOrderRow({
      order_id: ORDER_ID,
      status: "packing",
      courier_type: "mechanic",
      courier_id: MECHANIC_ID,
    });
    const result = await saveMechanicLocation(MECHANIC_ID, {
      latitude: 10.775,
      longitude: 106.701,
      currentJobId: ORDER_ID,
      currentJobType: "order",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(orderDeliveryStubs.insertedTravelPoints).toEqual([]);
    expect(
      mechanicWorkspaceRepoMocks.upsertMechanicLocation.mock.calls.length,
    ).toBe(0);
  });
});

describe("getNavigationBoard order targets", () => {
  test("lists shipping orders assigned to the mechanic as targets", async () => {
    mechanicStubs.location = makeLocationRow({ lat: 10.77, lng: 106.7 });
    mechanicStubs.profile = makeProfileRow();
    orderStubs.ordersByCourier = [
      makeOrderRow({
        order_id: ORDER_ID,
        status: "shipping",
        courier_type: "mechanic",
        courier_id: MECHANIC_ID,
        customer_name: "Tran Thi B",
        shipping_address: {
          province: "Ho Chi Minh",
          district: "Quan 1",
          ward: "Phuong Ben Nghe",
          street: "123 Duong ABC",
          fullText: "123 Duong ABC, Quan 1",
          lat: 10.78,
          lng: 106.72,
        },
      }),
    ];

    const result = await getNavigationBoard(MECHANIC_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const orderTarget = result.data.targets.find(
      (target) => target.kind === "order",
    );
    expect(orderTarget).toMatchObject({
      bookingId: ORDER_ID,
      customerName: "Tran Thi B",
      status: "en_route",
    });
    expect(orderTarget?.distanceKm).toBeGreaterThan(0);
  });

  test("drops orders without coordinates or already delivered", async () => {
    mechanicStubs.location = null;
    mechanicStubs.profile = makeProfileRow();
    orderStubs.ordersByCourier = [
      makeOrderRow({
        order_id: ORDER_ID,
        status: "shipping",
        courier_type: "mechanic",
        courier_id: MECHANIC_ID,
        shipping_address: null,
      }),
      makeOrderRow({
        order_id: "eeeeeeee-1111-4111-8111-eeeeeeeeeeee",
        status: "delivered",
        courier_type: "mechanic",
        courier_id: MECHANIC_ID,
      }),
    ];

    const result = await getNavigationBoard(MECHANIC_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.data.targets.filter((target) => target.kind === "order"),
    ).toEqual([]);
  });
});
