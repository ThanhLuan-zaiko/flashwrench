import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { PaymentRow } from "@/lib/payments/booking-payment.repository";
import { makePublicUser } from "../helpers/auth.fixtures";
import { BOOKING_ID, makeBookingRow } from "../helpers/mechanic.fixtures";
import { makeOrderRow } from "../helpers/parts.fixtures";
import { paymentRepoMocks } from "../helpers/payment.mocks";
import {
  guestBookingClaimRepoMocks,
  guestClaimStubs,
  guestOrderClaimRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicStubs,
  orderRepoMocks,
  orderStubs,
  paymentClaimRepoMocks,
  resetServiceMocks,
} from "../helpers/service-mocks";
import {
  resetWorkspaceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Guest-record claim suite: register/login absorb bookings + orders filed
// under the same normalized phone+email. Repositories are stubbed; the
// claim services and the auth orchestrator run for real.
mock.module(
  "@/lib/booking/guest-claim.repository",
  () => guestBookingClaimRepoMocks,
);
mock.module(
  "@/lib/orders/guest-claim.repository",
  () => guestOrderClaimRepoMocks,
);
mock.module(
  "@/lib/payments/payment-claim.repository",
  () => paymentClaimRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module(
  "@/lib/payments/booking-payment.repository",
  () => paymentRepoMocks,
);

import { claimGuestRecords } from "@/lib/auth/guest-claim.service";
import { claimGuestBookings } from "@/lib/booking/booking-claim.service";
import { claimGuestOrders } from "@/lib/orders/order-claim.service";

const USER = makePublicUser({ phone: "0909999888", email: "be@example.com" });
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const OTHER_BOOKING_ID = "aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa";

function makePaymentRow(overrides?: Partial<PaymentRow>): PaymentRow {
  return {
    payment_id: "pay-1",
    ref_type: "booking",
    ref_id: BOOKING_ID,
    customer_id: null,
    mechanic_id: null,
    amount: 450000,
    method: "cod",
    status: "paid",
    provider_ref: null,
    recorded_by: null,
    customer_confirmed: true,
    paid_at: new Date("2026-09-20T10:00:00.000Z"),
    created_at: new Date("2026-09-20T10:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  resetServiceMocks();
  resetWorkspaceMocks();
});

describe("claimGuestBookings", () => {
  test("claims the booking whose stored email matches the account", async () => {
    guestClaimStubs.bookingRefs = [
      { booking_id: BOOKING_ID, email: "be@example.com" },
    ];
    mechanicStubs.bookingById = makeBookingRow({
      customer_id: null,
      customer_phone: "0909999888",
    });

    const claimed = await claimGuestBookings({
      userId: USER.id,
      phone: USER.phone,
      email: USER.email,
    });

    expect(claimed).toBe(1);
    expect(guestClaimStubs.bookingClaims[0]).toMatchObject({
      bookingId: BOOKING_ID,
      customerId: USER.id,
      scheduledAt: new Date("2026-09-16T07:00:00.000Z"),
      status: "pending",
      total: 450000,
      monthBucket: "2026-09",
    });
    expect(guestClaimStubs.deletedBookingRefs).toEqual([
      { phone: USER.phone, bookingId: BOOKING_ID },
    ]);
  });

  test("skips refs whose email differs — shared phones never leak", async () => {
    guestClaimStubs.bookingRefs = [
      { booking_id: BOOKING_ID, email: "someone-else@example.com" },
    ];
    mechanicStubs.bookingById = makeBookingRow({ customer_id: null });

    const claimed = await claimGuestBookings({
      userId: USER.id,
      phone: USER.phone,
      email: USER.email,
    });

    expect(claimed).toBe(0);
    expect(guestClaimStubs.bookingClaims).toHaveLength(0);
    // The ref stays: no account holding this phone can ever match it now,
    // but deleting it is the claim service's call only after a match.
    expect(guestClaimStubs.deletedBookingRefs).toHaveLength(0);
  });

  test("cleans up refs pointing at rows already owned or gone", async () => {
    guestClaimStubs.bookingRefs = [
      { booking_id: BOOKING_ID, email: "be@example.com" },
      { booking_id: OTHER_BOOKING_ID, email: "be@example.com" },
    ];
    // First read: already-owned row. Second read: missing row.
    mechanicStubs.bookingReadQueue = [
      makeBookingRow({ customer_id: "someone-else" }),
      null,
    ];

    const claimed = await claimGuestBookings({
      userId: USER.id,
      phone: USER.phone,
      email: USER.email,
    });

    expect(claimed).toBe(0);
    expect(guestClaimStubs.bookingClaims).toHaveLength(0);
    expect(guestClaimStubs.deletedBookingRefs).toHaveLength(2);
  });

  test("re-owns payments the guest already made", async () => {
    guestClaimStubs.bookingRefs = [
      { booking_id: BOOKING_ID, email: "be@example.com" },
    ];
    mechanicStubs.bookingById = makeBookingRow({ customer_id: null });
    workspaceStubs.paymentRefIds = ["pay-1", "pay-2"];
    workspaceStubs.paymentRowsById.set("pay-1", makePaymentRow());
    workspaceStubs.paymentRowsById.set(
      "pay-2",
      makePaymentRow({ payment_id: "pay-2", customer_id: "already-owned" }),
    );

    const claimed = await claimGuestBookings({
      userId: USER.id,
      phone: USER.phone,
      email: USER.email,
    });

    expect(claimed).toBe(1);
    // Only the owner-less receipt moves; the owned one is never stolen.
    expect(guestClaimStubs.paymentAttaches).toHaveLength(1);
    expect(guestClaimStubs.paymentAttaches[0]).toMatchObject({
      paymentId: "pay-1",
      customerId: USER.id,
      refType: "booking",
      refId: BOOKING_ID,
      amount: 450000,
      // 2026-09-20T10:00Z is 17:00 in Asia/Ho_Chi_Minh — same revenue day.
      periodBucket: "2026-09-20",
    });
  });

  test("keeps claiming after one row fails — its ref survives for a retry", async () => {
    guestClaimStubs.bookingRefs = [
      { booking_id: BOOKING_ID, email: "be@example.com" },
      { booking_id: OTHER_BOOKING_ID, email: "be@example.com" },
    ];
    mechanicStubs.bookingById = makeBookingRow({ customer_id: null });
    guestClaimStubs.failingBookingClaims.add(BOOKING_ID);

    const claimed = await claimGuestBookings({
      userId: USER.id,
      phone: USER.phone,
      email: USER.email,
    });

    expect(claimed).toBe(1);
    expect(guestClaimStubs.bookingClaims).toHaveLength(1);
    expect(guestClaimStubs.deletedBookingRefs).toEqual([
      { phone: USER.phone, bookingId: OTHER_BOOKING_ID },
    ]);
  });
});

describe("claimGuestOrders", () => {
  test("claims the order whose stored email matches the account", async () => {
    guestClaimStubs.orderRefs = [
      { order_id: ORDER_ID, email: "be@example.com" },
    ];
    orderStubs.orderById = makeOrderRow({ customer_id: null });

    const claimed = await claimGuestOrders({
      userId: USER.id,
      phone: USER.phone,
      email: USER.email,
    });

    expect(claimed).toBe(1);
    expect(guestClaimStubs.orderClaims[0]).toMatchObject({
      orderId: ORDER_ID,
      customerId: USER.id,
      createdAt: new Date("2026-01-05T00:00:00.000Z"),
      status: "pending",
      total: 270000,
      monthBucket: "2026-01",
    });
    expect(guestClaimStubs.deletedOrderRefs).toEqual([
      { phone: USER.phone, orderId: ORDER_ID },
    ]);
  });

  test("skips refs whose email differs", async () => {
    guestClaimStubs.orderRefs = [
      { order_id: ORDER_ID, email: "other@example.com" },
    ];
    orderStubs.orderById = makeOrderRow({ customer_id: null });

    const claimed = await claimGuestOrders({
      userId: USER.id,
      phone: USER.phone,
      email: USER.email,
    });

    expect(claimed).toBe(0);
    expect(guestClaimStubs.orderClaims).toHaveLength(0);
  });
});

describe("claimGuestRecords", () => {
  test("absorbs bookings and orders under the same contact pair", async () => {
    guestClaimStubs.bookingRefs = [
      { booking_id: BOOKING_ID, email: "be@example.com" },
    ];
    guestClaimStubs.orderRefs = [
      { order_id: ORDER_ID, email: "be@example.com" },
    ];
    mechanicStubs.bookingById = makeBookingRow({ customer_id: null });
    orderStubs.orderById = makeOrderRow({ customer_id: null });

    await claimGuestRecords(USER);

    expect(guestClaimStubs.bookingClaims).toHaveLength(1);
    expect(guestClaimStubs.orderClaims).toHaveLength(1);
    expect(guestClaimStubs.bookingClaims[0]?.customerId).toBe(USER.id);
    expect(guestClaimStubs.orderClaims[0]?.customerId).toBe(USER.id);
  });

  test("normalizes the contact before matching", async () => {
    guestClaimStubs.bookingRefs = [
      { booking_id: BOOKING_ID, email: "be@example.com" },
    ];
    mechanicStubs.bookingById = makeBookingRow({ customer_id: null });

    await claimGuestRecords(
      makePublicUser({ phone: "+84 909 999 888", email: "BE@Example.com" }),
    );

    expect(
      guestBookingClaimRepoMocks.listGuestBookingRefsByPhone.mock.calls[0]?.[0],
    ).toBe("0909999888");
    expect(guestClaimStubs.bookingClaims).toHaveLength(1);
  });
});
