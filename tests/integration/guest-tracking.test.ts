import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  MECHANIC_ID,
  makeBookingItemRow,
  makeBookingRow,
  makeLocationRow,
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
  orderRepoMocks,
  orderStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";

// Public tracking services behind /api/track/* — the booking/order UUID
// is the capability, so the payload must stay free of customer identity.
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module(
  "@/lib/orders/orders-delivery.repository",
  () => orderDeliveryRepoMocks,
);

import { getPublicBookingTracking } from "@/lib/booking/booking-reader.service";
import { getPublicOrderTracking } from "@/lib/orders/order-track.service";

beforeEach(() => {
  resetMechanicMocks();
  resetPartsMocks();
});

describe("getPublicBookingTracking", () => {
  test("rejects a malformed id before reading storage", async () => {
    const result = await getPublicBookingTracking("not-a-uuid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(mechanicBookingsRepoMocks.findBookingRowById).not.toHaveBeenCalled();
  });

  test("returns 404 for an unknown booking", async () => {
    const result = await getPublicBookingTracking(BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  test("returns progress data without customer identity fields", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      customer_id: null,
      payment_confirm_code: "FW1234",
    });
    mechanicStubs.itemRows = [makeBookingItemRow()];

    const result = await getPublicBookingTracking(BOOKING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      bookingId: BOOKING_ID,
      status: "pending",
      serviceName: "Thay dau dong co",
      mechanicName: "Nguyen Van A",
      paymentConfirmCode: "FW1234",
      timezone: "Asia/Ho_Chi_Minh",
      destination: { lat: 10.772291, lng: 106.698007 },
    });
    // The contract: nothing in the payload names or contacts the customer.
    const keys = Object.keys(result.data);
    for (const leaked of ["customerName", "customerPhone", "customerEmail"]) {
      expect(keys).not.toContain(leaked);
    }
  });

  test("hides the confirm code once the booking is paid", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      payment_status: "paid",
      payment_confirm_code: "FW1234",
    });
    const result = await getPublicBookingTracking(BOOKING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.paymentConfirmCode).toBeNull();
  });

  test("exposes the live mechanic pin only while on the job", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "en_route" });
    mechanicStubs.location = makeLocationRow({
      mechanic_id: MECHANIC_ID,
      current_job_id: BOOKING_ID,
      current_job_type: "booking",
      updated_at: new Date(),
    });
    const enRoute = await getPublicBookingTracking(BOOKING_ID);
    expect(enRoute.ok).toBe(true);
    if (!enRoute.ok) return;
    expect(enRoute.data.location).toMatchObject({ lat: 10.77, lng: 106.7 });

    // A pending booking never reveals a position even if one is stored.
    mechanicStubs.bookingById = makeBookingRow({ status: "pending" });
    const pending = await getPublicBookingTracking(BOOKING_ID);
    expect(pending.ok).toBe(true);
    if (!pending.ok) return;
    expect(pending.data.location).toBeNull();
  });
});

describe("getPublicOrderTracking", () => {
  test("rejects a malformed id before reading storage", async () => {
    const result = await getPublicOrderTracking("not-a-uuid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(orderRepoMocks.findOrderRowById).not.toHaveBeenCalled();
  });

  test("returns 404 for an unknown order", async () => {
    const result = await getPublicOrderTracking(
      "ffffffff-ffff-4fff-8fff-ffffffffffff",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  test("returns progress data without customer identity fields", async () => {
    orderStubs.orderById = makeOrderRow({
      customer_id: null,
      status: "packing",
      courier_name: "GiaoHangNhanh",
      tracking_code: "GHN-001",
      shipping_address: {
        province: "Ho Chi Minh",
        district: "Quan 1",
        ward: "Ben Nghe",
        street: "123 Duong ABC",
        fullText: "123 Duong ABC, Quan 1",
        lat: 10.7626,
        lng: 106.6601,
      },
    });

    const result = await getPublicOrderTracking(
      "ffffffff-ffff-4fff-8fff-ffffffffffff",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      orderId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      status: "packing",
      paymentStatus: "unpaid",
      fulfillmentType: "delivery",
      courierName: "GiaoHangNhanh",
      trackingCode: "GHN-001",
      destination: { lat: 10.7626, lng: 106.6601 },
    });
    const keys = Object.keys(result.data);
    for (const leaked of ["customerName", "customerPhone", "customerEmail"]) {
      expect(keys).not.toContain(leaked);
    }
  });

  test("only shows the courier pin while the order is shipping", async () => {
    const location = makeLocationRow({
      mechanic_id: MECHANIC_ID,
      updated_at: new Date(),
    });
    mechanicStubs.location = location;

    orderStubs.orderById = makeOrderRow({
      status: "shipping",
      courier_type: "mechanic",
      courier_id: MECHANIC_ID,
    });
    const shipping = await getPublicOrderTracking(
      "ffffffff-ffff-4fff-8fff-ffffffffffff",
    );
    expect(shipping.ok).toBe(true);
    if (!shipping.ok) return;
    expect(shipping.data.courier).toMatchObject({ lat: 10.77, lng: 106.7 });

    orderStubs.orderById = makeOrderRow({
      status: "delivered",
      courier_type: "mechanic",
      courier_id: MECHANIC_ID,
    });
    const delivered = await getPublicOrderTracking(
      "ffffffff-ffff-4fff-8fff-ffffffffffff",
    );
    expect(delivered.ok).toBe(true);
    if (!delivered.ok) return;
    expect(delivered.data.courier).toBeNull();
  });
});
