import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  bookingWorkflowRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);

import { transitionBooking } from "@/lib/booking/booking-workflow.service";

const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000000";

function writeInput(before: ReturnType<typeof makeBookingRow>, at: Date) {
  return {
    before,
    status: "confirmed" as const,
    mechanicId: null,
    mechanicName: null,
    actorId: SYSTEM_ACTOR,
    note: null,
    at,
  };
}

// The claim moves bookings_by_id before the denormalized projection runs.
// Transient failures (a paxos table being created mid-request, a write
// timeout after the LWT already applied) used to strand the row
// half-written; the service now verifies landed claims and retries the
// idempotent projection once.
describe("transitionBooking projection retry", () => {
  beforeEach(() => {
    resetMechanicMocks();
  });

  test("retries the projection once after a transient failure", async () => {
    const before = makeBookingRow({ status: "pending" });
    bookingWorkflowRepoMocks.projectBookingTransition.mockImplementationOnce(
      async () => {
        throw new Error("transient schema change");
      },
    );

    const result = await transitionBooking(writeInput(before, new Date()));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("confirmed");
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(2);
    expect(mechanicStubs.transitionProjected.length).toBe(1);
  });

  test("propagates when the projection fails on both attempts", async () => {
    const before = makeBookingRow({ status: "pending" });
    bookingWorkflowRepoMocks.projectBookingTransition.mockImplementationOnce(
      async () => {
        throw new Error("first failure");
      },
    );
    bookingWorkflowRepoMocks.projectBookingTransition.mockImplementationOnce(
      async () => {
        throw new Error("second failure");
      },
    );

    await expect(
      transitionBooking(writeInput(before, new Date())),
    ).rejects.toThrow("second failure");
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(2);
  });
});

describe("transitionBooking claim error recovery", () => {
  beforeEach(() => {
    resetMechanicMocks();
  });

  test("continues to the projection when the claim already landed", async () => {
    const at = new Date();
    const before = makeBookingRow({ status: "pending", mechanic_id: null });
    bookingWorkflowRepoMocks.claimBookingTransition.mockImplementationOnce(
      async () => {
        throw new Error("write timeout after apply");
      },
    );
    // The LWT applied despite the driver error: a re-read sees the write.
    mechanicStubs.bookingById = {
      ...before,
      status: "confirmed",
      updated_at: at,
    };

    const result = await transitionBooking(writeInput(before, at));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("confirmed");
    expect(mechanicStubs.transitionProjected.length).toBe(1);
  });

  test("propagates the claim error when the write never landed", async () => {
    const before = makeBookingRow({ status: "pending" });
    bookingWorkflowRepoMocks.claimBookingTransition.mockImplementationOnce(
      async () => {
        throw new Error("connection dropped before apply");
      },
    );
    mechanicStubs.bookingById = before;

    await expect(
      transitionBooking(writeInput(before, new Date())),
    ).rejects.toThrow("connection dropped before apply");
    expect(mechanicStubs.transitionProjected.length).toBe(0);
  });
});
