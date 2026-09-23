import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeLocationRow } from "../helpers/mechanic.fixtures";
import {
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  makeOrderRow,
  makeOrderTravelPointRow,
} from "../helpers/parts.fixtures";
import {
  orderDeliveryRepoMocks,
  orderDeliveryStubs,
  orderRepoMocks,
  orderStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module(
  "@/lib/orders/orders-delivery.repository",
  () => orderDeliveryRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);

import { getMyOrderTrack } from "@/lib/orders/order-track.service";

const CUSTOMER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const MECHANIC_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  resetPartsMocks();
  resetMechanicMocks();
});

describe("getMyOrderTrack", () => {
  test("rejects a malformed order id", async () => {
    const result = await getMyOrderTrack(CUSTOMER, "not-a-uuid");
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  test("404s for missing or foreign orders", async () => {
    orderStubs.orderById = null;
    expect(await getMyOrderTrack(CUSTOMER, ORDER_ID)).toMatchObject({
      ok: false,
      status: 404,
    });
    orderStubs.orderById = makeOrderRow({ customer_id: "someone-else" });
    expect(await getMyOrderTrack(CUSTOMER, ORDER_ID)).toMatchObject({
      ok: false,
      status: 404,
    });
  });

  test("returns destination + breadcrumb points for the owner", async () => {
    orderStubs.orderById = makeOrderRow({
      shipping_address: {
        province: "Ho Chi Minh",
        district: "Quan 1",
        ward: "Phuong Ben Nghe",
        street: "123 Duong ABC",
        fullText: "123 Duong ABC, Quan 1",
        lat: 10.78,
        lng: 106.72,
      },
    });
    orderDeliveryStubs.travelPointRows = [
      makeOrderTravelPointRow(),
      makeOrderTravelPointRow({
        recorded_at: new Date("2026-01-05T01:05:00.000Z"),
        lat: 10.775,
      }),
      // Bad fixes are filtered out instead of breaking the map.
      makeOrderTravelPointRow({ lat: null }),
    ];
    const result = await getMyOrderTrack(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.destination).toEqual({ lat: 10.78, lng: 106.72 });
    expect(result.data.points).toHaveLength(2);
    expect(result.data.courier).toBeNull();
  });

  test("exposes the mechanic's live position for mechanic couriers", async () => {
    orderStubs.orderById = makeOrderRow({
      status: "shipping",
      courier_type: "mechanic",
      courier_id: MECHANIC_ID,
    });
    mechanicStubs.location = makeLocationRow({
      lat: 10.77,
      lng: 106.7,
      updated_at: new Date("2026-01-05T01:10:00.000Z"),
    });
    const result = await getMyOrderTrack(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.courier).toMatchObject({ lat: 10.77, lng: 106.7 });
  });

  test("third-party couriers have no internal live position", async () => {
    orderStubs.orderById = makeOrderRow({
      status: "shipping",
      courier_type: "third_party",
      courier_id: null,
      courier_name: "GiaoHangNhanh",
      tracking_code: "GHN-1",
    });
    const result = await getMyOrderTrack(CUSTOMER, ORDER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.courier).toBeNull();
    expect(
      mechanicWorkspaceRepoMocks.findMechanicLocationRow,
    ).not.toHaveBeenCalled();
  });
});
