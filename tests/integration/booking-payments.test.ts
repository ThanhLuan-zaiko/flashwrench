import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  completedBooking,
  paymentBody,
  paymentCustomer,
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
const customer = paymentCustomer;

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  mechanicStubs.bookingById = completedBooking();
});

describe("recordBookingPayment guards", () => {
  test("rejects customers, dispatchers and foreign mechanics", async () => {
    for (const actor of [
      customer,
      makePublicUser({ role: "dispatcher" }),
      makePublicUser({ id: MECHANIC_OTHER_ID, role: "mechanic" }),
    ]) {
      const result = await recordBookingPayment(
        actor,
        BOOKING_ID,
        paymentBody(),
      );
      expect(result).toMatchObject({ ok: false, status: 403 });
    }
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });

  test("rejects non-record bodies, bad method, missing confirm", async () => {
    expect(
      await recordBookingPayment(mechanic, BOOKING_ID, null),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await recordBookingPayment(
        mechanic,
        BOOKING_ID,
        paymentBody({ method: "crypto" }),
      ),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await recordBookingPayment(
        mechanic,
        BOOKING_ID,
        paymentBody({ confirmed: false }),
      ),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await recordBookingPayment(
        mechanic,
        BOOKING_ID,
        paymentBody({ confirmed: "yes" }),
      ),
    ).toMatchObject({ ok: false, status: 400 });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });

  test("rejects non-numeric, non-positive and over-total amounts", async () => {
    for (const amount of ["450001", true, [], "abc", 0, -50, 450001]) {
      const result = await recordBookingPayment(
        mechanic,
        BOOKING_ID,
        paymentBody({ amount }),
      );
      expect(result).toMatchObject({ ok: false, status: 400 });
    }
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });

  test("cod collection requires the customer's confirm code", async () => {
    // No code issued yet: the mechanic must trigger the code flow first.
    mechanicStubs.bookingById = completedBooking({
      payment_confirm_code: null,
    });
    const unissued = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ confirmCode: undefined }),
    );
    expect(unissued).toMatchObject({ ok: false, status: 400 });
    expect(unissued.ok ? null : unissued.errors.confirmCode).toBeTruthy();

    // Code issued but the mechanic echoes a wrong one -> audited.
    mechanicStubs.bookingById = completedBooking();
    const wrong = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ confirmCode: "000000" }),
    );
    expect(wrong).toMatchObject({ ok: false, status: 400 });
    expect(
      workspaceStubs.auditEvents.some(
        (event) => event.action === "confirm_failed",
      ),
    ).toBe(true);

    // Bank transfer leaves a bank trail: no code needed.
    const transfer = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ method: "bank_transfer", confirmCode: undefined }),
    );
    expect(transfer.ok).toBe(true);

    // Malformed codes are rejected before touching the row.
    const malformed = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ confirmCode: "12" }),
    );
    expect(malformed).toMatchObject({ ok: false, status: 400 });
  });

  test("rejects a malformed paymentId", async () => {
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ paymentId: "not-a-uuid" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });

  test("rejects non-completed bookings", async () => {
    mechanicStubs.bookingById = completedBooking({ status: "in_progress" });
    expect(
      await recordBookingPayment(mechanic, BOOKING_ID, paymentBody()),
    ).toMatchObject({ ok: false, status: 400 });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });

  test("settles guest bookings whose customer_id is null", async () => {
    // Guest intake stores the contact snapshot with customer_id null: the
    // receipt writes to by_id/_ref/_period and skips by_customer — the
    // guest follows the order through the public tracking link instead.
    mechanicStubs.bookingById = completedBooking({ customer_id: null });

    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ method: "bank_transfer" }),
    );

    expect(result.ok).toBe(true);
    const write = paymentRepoMocks.claimBookingPayment.mock.calls[0]?.[0];
    expect(write?.customerId).toBeNull();
    expect(
      revenueServiceMocks.projectReceipt.mock.calls[0]?.[0].customerId,
    ).toBeNull();
  });
});
