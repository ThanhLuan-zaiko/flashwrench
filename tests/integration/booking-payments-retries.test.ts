import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  completedBooking,
  paymentAdmin,
  paymentBody,
  paymentMechanic,
} from "../helpers/booking-payment.fixtures";
import { BOOKING_ID, MECHANIC_OTHER_ID } from "../helpers/mechanic.fixtures";
import {
  bookingWorkflowRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  domainPublishMocks,
  makePaymentReceiptRow,
  paymentPromptRepoMocks,
  paymentRepoMocks,
  resetWorkspaceMocks,
  revenueServiceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
mock.module(
  "@/lib/payments/booking-payment.repository",
  () => paymentRepoMocks,
);
mock.module("@/lib/rescue/rescue-payment.repository", () => ({
  setRescuePaymentCode: mock(async () => undefined),
}));
mock.module("@/lib/rescue/rescue-workflow.repository", () => ({
  findRescueRowById: mock(async () => null),
}));
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);
mock.module("@/lib/revenue/revenue.service", () => revenueServiceMocks);
mock.module(
  "@/lib/payments/payment-prompt.repository",
  () => paymentPromptRepoMocks,
);

import { recordBookingPayment } from "@/lib/payments/booking-payment.service";

const mechanic = paymentMechanic;
const admin = paymentAdmin;

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  mechanicStubs.bookingById = completedBooking();
});

describe("recordBookingPayment success and retries", () => {
  test("records once, projects, flips payment_status and publishes", async () => {
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      id: BOOKING_ID,
      bookingId: BOOKING_ID,
      amount: 450000,
      method: "cod",
    });
    expect(paymentRepoMocks.projectBookingPayment.mock.calls.length).toBe(1);
    expect(paymentRepoMocks.claimBookingPaymentStatus.mock.calls.length).toBe(
      1,
    );
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "payment-recorded",
    );
  });

  test("admin may record for the assigned mechanic's booking", async () => {
    const result = await recordBookingPayment(admin, BOOKING_ID, paymentBody());
    expect(result.ok).toBe(true);
  });

  test("a lost claim rereads the receipt, repairs and publishes", async () => {
    workspaceStubs.paymentClaimed = false;
    workspaceStubs.paymentById = makePaymentReceiptRow();
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(result.ok).toBe(true);
    expect(paymentRepoMocks.projectBookingPayment.mock.calls.length).toBe(1);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });

  test("a lost claim with a mismatched receipt is a conflict", async () => {
    workspaceStubs.paymentClaimed = false;
    workspaceStubs.paymentById = makePaymentReceiptRow({
      method: "bank_transfer",
    });
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(paymentRepoMocks.projectBookingPayment.mock.calls.length).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });

  test("already-paid booking with a matching receipt stays idempotent", async () => {
    mechanicStubs.bookingById = completedBooking({ payment_status: "paid" });
    workspaceStubs.paymentById = makePaymentReceiptRow();
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(result.ok).toBe(true);
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });

  test("already-paid booking without a matching receipt is a conflict", async () => {
    mechanicStubs.bookingById = completedBooking({ payment_status: "paid" });
    workspaceStubs.paymentById = null;
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);

    workspaceStubs.paymentById = makePaymentReceiptRow({
      customer_id: MECHANIC_OTHER_ID,
    });
    const foreign = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(foreign).toMatchObject({ ok: false, status: 409 });
  });

  test("malformed persisted receipts are never repaired with invented dates", async () => {
    mechanicStubs.bookingById = completedBooking({ payment_status: "paid" });
    workspaceStubs.paymentById = makePaymentReceiptRow({ created_at: null });
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(paymentRepoMocks.projectBookingPayment.mock.calls.length).toBe(0);
  });

  test("lost status CAS succeeds only when the reread is still paid+completed", async () => {
    workspaceStubs.paymentStatusClaimed = false;
    workspaceStubs.paymentById = makePaymentReceiptRow();
    mechanicStubs.bookingReadQueue = [
      completedBooking(),
      completedBooking({ payment_status: "paid" }),
    ];
    const claimed = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(claimed.ok).toBe(true);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);

    resetWorkspaceMocks();
    resetMechanicMocks();
    mechanicStubs.bookingById = completedBooking();
    workspaceStubs.paymentStatusClaimed = false;
    workspaceStubs.paymentById = makePaymentReceiptRow();
    const denied = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(denied).toMatchObject({ ok: false, status: 409 });
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });

  test("partial, refunded and cross-user ref rows deny without write", async () => {
    workspaceStubs.paymentRefIds = ["99999999-9999-4999-8999-999999999999"];
    workspaceStubs.paymentRowsById.set(
      "99999999-9999-4999-8999-999999999999",
      makePaymentReceiptRow({
        payment_id: "99999999-9999-4999-8999-999999999999",
        status: "partial",
      }),
    );
    const partial = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(partial).toMatchObject({ ok: false, status: 409 });

    workspaceStubs.paymentRowsById.set(
      "99999999-9999-4999-8999-999999999999",
      makePaymentReceiptRow({
        payment_id: "99999999-9999-4999-8999-999999999999",
        customer_id: MECHANIC_OTHER_ID,
        status: "paid",
      }),
    );
    const crossUser = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(crossUser).toMatchObject({ ok: false, status: 409 });

    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });
});
