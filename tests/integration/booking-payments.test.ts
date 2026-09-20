import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  bookingWorkflowRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  domainPublishMocks,
  makePaymentReceiptRow,
  paymentRepoMocks,
  resetWorkspaceMocks,
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
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { recordBookingPayment } from "@/lib/payments/booking-payment.service";

const mechanic = makePublicUser({
  id: MECHANIC_ID,
  role: "mechanic",
});
const admin = makePublicUser({
  id: "eeeeeeee-3333-4333-8333-eeeeeeeeeeee",
  role: "admin",
});
const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });

function completedBooking(overrides?: Parameters<typeof makeBookingRow>[0]) {
  return makeBookingRow({ status: "completed", ...overrides });
}

function paymentBody(overrides?: Record<string, unknown>) {
  return { method: "cod", confirmed: true, amount: 450000, ...overrides };
}

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

  test("rejects mismatched and non-numeric supplied amounts", async () => {
    for (const amount of [1, "450001", true, [], "abc"]) {
      const result = await recordBookingPayment(
        mechanic,
        BOOKING_ID,
        paymentBody({ amount }),
      );
      expect(result).toMatchObject({ ok: false, status: 400 });
    }
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });

  test("rejects non-completed bookings and missing customer ids", async () => {
    mechanicStubs.bookingById = completedBooking({ status: "in_progress" });
    expect(
      await recordBookingPayment(mechanic, BOOKING_ID, paymentBody()),
    ).toMatchObject({ ok: false, status: 400 });

    mechanicStubs.bookingById = completedBooking({ customer_id: null });
    expect(
      await recordBookingPayment(mechanic, BOOKING_ID, paymentBody()),
    ).toMatchObject({ ok: false, status: 409 });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });
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
    workspaceStubs.paymentById = makePaymentReceiptRow({
      payment_id: "99999999-9999-4999-8999-999999999999",
      status: "partial",
    });
    const partial = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(partial).toMatchObject({ ok: false, status: 409 });

    workspaceStubs.paymentById = makePaymentReceiptRow({
      payment_id: "99999999-9999-4999-8999-999999999999",
      customer_id: MECHANIC_OTHER_ID,
      status: "paid",
    });
    const crossUser = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody(),
    );
    expect(crossUser).toMatchObject({ ok: false, status: 409 });

    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });
});
