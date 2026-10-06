import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  MECHANIC_ID,
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

const mechanic = makePublicUser({
  id: MECHANIC_ID,
  role: "mechanic",
});

const CONFIRM_CODE = "654321";

function completedBooking(overrides?: Parameters<typeof makeBookingRow>[0]) {
  return makeBookingRow({
    status: "completed",
    payment_confirm_code: CONFIRM_CODE,
    ...overrides,
  });
}

function paymentBody(overrides?: Record<string, unknown>) {
  return {
    method: "cod",
    confirmed: true,
    amount: 450000,
    confirmCode: CONFIRM_CODE,
    ...overrides,
  };
}

const FIRST_RECEIPT = "11111111-1111-4111-8111-111111111111";
const SECOND_RECEIPT = "22222222-2222-4222-8222-222222222222";

// Booking already saw one 150k installment of a 450k job: payment_status
// flipped to 'partial' and the receipt sits in payments_by_ref/_by_id.
function stubPartialBooking() {
  mechanicStubs.bookingById = completedBooking({
    payment_status: "partial",
  });
  workspaceStubs.paymentRefIds = [FIRST_RECEIPT];
  workspaceStubs.paymentRowsById.set(
    FIRST_RECEIPT,
    makePaymentReceiptRow({ payment_id: FIRST_RECEIPT, amount: 150000 }),
  );
}

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  mechanicStubs.bookingById = completedBooking();
});

describe("recordBookingPayment installments", () => {
  test("a first installment settles partially and reports the balance", async () => {
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ amount: 150000 }),
    );
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      amount: 150000,
      received: 150000,
      outstanding: 300000,
      paymentStatus: "partial",
    });
    expect(paymentRepoMocks.claimBookingPaymentStatus.mock.calls[0]).toEqual([
      BOOKING_ID,
      "partial",
      "completed",
      "unpaid",
      expect.any(Date),
    ]);
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "payment-recorded",
    );
  });

  test("a top-up on a partial booking settles the rest as paid", async () => {
    stubPartialBooking();
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ amount: 300000, paymentId: SECOND_RECEIPT }),
    );
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      id: SECOND_RECEIPT,
      amount: 300000,
      received: 450000,
      outstanding: 0,
      paymentStatus: "paid",
    });
    expect(paymentRepoMocks.claimBookingPaymentStatus.mock.calls[0]).toEqual([
      BOOKING_ID,
      "paid",
      "completed",
      "partial",
      expect.any(Date),
    ]);
  });

  test("omitting the amount settles the remaining balance", async () => {
    stubPartialBooking();
    const result = await recordBookingPayment(mechanic, BOOKING_ID, {
      method: "cod",
      confirmed: true,
      confirmCode: CONFIRM_CODE,
      paymentId: SECOND_RECEIPT,
    });
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.data.amount).toBe(300000);
    expect(result.data.paymentStatus).toBe("paid");
  });

  test("an installment may not exceed the remaining balance", async () => {
    stubPartialBooking();
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ amount: 300001 }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });

  test("retrying with the same paymentId replays instead of duplicating", async () => {
    stubPartialBooking();
    workspaceStubs.paymentRowsById.set(
      SECOND_RECEIPT,
      makePaymentReceiptRow({
        payment_id: SECOND_RECEIPT,
        amount: 300000,
      }),
    );
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ amount: 300000, paymentId: SECOND_RECEIPT }),
    );
    expect(result).toMatchObject({ ok: true });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });

  test("a paymentId collision with different payload is a conflict", async () => {
    stubPartialBooking();
    workspaceStubs.paymentRowsById.set(
      SECOND_RECEIPT,
      makePaymentReceiptRow({ payment_id: SECOND_RECEIPT, amount: 100000 }),
    );
    const result = await recordBookingPayment(
      mechanic,
      BOOKING_ID,
      paymentBody({ amount: 300000, paymentId: SECOND_RECEIPT }),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(paymentRepoMocks.claimBookingPayment.mock.calls.length).toBe(0);
  });
});
