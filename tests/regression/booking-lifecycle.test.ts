import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ResolvedWorkflowWrite } from "@/lib/booking/booking-workflow.repository";
import type { MechanicBookingRow } from "@/lib/mechanic/mechanic.types";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import {
  bookingWorkflowRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { serviceStubs, userRepoMocks } from "../helpers/service-mocks";
import {
  customerBookingsRepoMocks,
  dispatchRepoMocks,
  domainPublishMocks,
  paymentRepoMocks,
  resetWorkspaceMocks,
  reviewRepoMocks,
  vehicleRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

const state = {
  booking: null as MechanicBookingRow | null,
  activeJob: null as string | null,
  claimed: true,
};

mock.module("@/lib/mechanic/mechanic-bookings.repository", () => ({
  ...mechanicBookingsRepoMocks,
  findBookingRowById: mock(
    async (): Promise<MechanicBookingRow | null> => state.booking,
  ),
  findMechanicActiveJob: mock(
    async (): Promise<string | null> => state.activeJob,
  ),
  insertMechanicActiveJob: mock(
    async (_mechanicId: string, bookingId: string): Promise<boolean> => {
      if (state.activeJob === null) {
        state.activeJob = bookingId;
        return true;
      }
      return false;
    },
  ),
  deleteMechanicActiveJob: mock(
    async (_mechanicId: string, bookingId: string): Promise<void> => {
      if (state.activeJob === bookingId) state.activeJob = null;
    },
  ),
}));
mock.module("@/lib/booking/booking-workflow.repository", () => ({
  ...bookingWorkflowRepoMocks,
  claimBookingTransition: mock(
    async (write: ResolvedWorkflowWrite): Promise<boolean> => {
      if (!state.claimed) return false;
      state.booking = {
        ...write.before,
        status: write.status,
        mechanic_id: write.mechanicId,
        mechanic_name: write.mechanicName,
        updated_at: write.at,
      };
      return true;
    },
  ),
}));
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);
mock.module("@/lib/dispatch/dispatch.repository", () => dispatchRepoMocks);
mock.module(
  "@/lib/booking/customer-bookings.repository",
  () => customerBookingsRepoMocks,
);
mock.module("@/lib/booking/review.repository", () => reviewRepoMocks);
mock.module(
  "@/lib/payments/booking-payment.repository",
  () => paymentRepoMocks,
);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { createBookingReview } from "@/lib/booking/review.service";
import { applyDispatchAction } from "@/lib/dispatch/dispatch.service";
import { applyMechanicBookingAction } from "@/lib/mechanic/mechanic-bookings.service";
import { recordBookingPayment } from "@/lib/payments/booking-payment.service";

const dispatcher = makePublicUser({
  id: "dddddddd-3333-4333-8333-dddddddddddd",
  role: "dispatcher",
});
const mechanic = makePublicUser({ id: MECHANIC_ID, role: "mechanic" });
const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  state.booking = makeBookingRow({ status: "pending", mechanic_id: null });
  state.activeJob = null;
  state.claimed = true;
  mechanicStubs.profile = makeProfileRow();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("full booking lifecycle", () => {
  test("booking -> assign -> accept -> travel -> work -> complete -> receipt -> review", async () => {
    const booking = state.booking;
    if (!booking) throw new Error("missing booking");

    expect(
      await applyMechanicBookingAction(MECHANIC_OTHER_ID, BOOKING_ID, "accept"),
    ).toMatchObject({ ok: false, status: 403 });
    expect(
      await applyDispatchAction(customer, BOOKING_ID, { action: "confirm" }),
    ).toMatchObject({ ok: false, status: 403 });

    const assigned = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "assign",
      mechanicId: MECHANIC_ID,
      expectedUpdatedAt: booking.updated_at?.toISOString(),
    });
    expect(assigned.ok).toBe(true);
    expect(state.booking?.mechanic_id).toBe(MECHANIC_ID);
    expect(state.booking?.status).toBe("pending");

    expect(
      await applyMechanicBookingAction(MECHANIC_OTHER_ID, BOOKING_ID, "accept"),
    ).toMatchObject({ ok: false, status: 403 });

    for (const [action, status] of [
      ["accept", "mechanic_assigned"],
      ["start-travel", "en_route"],
      ["start-work", "in_progress"],
      ["complete", "completed"],
    ] as const) {
      const step = await applyMechanicBookingAction(
        MECHANIC_ID,
        BOOKING_ID,
        action,
      );
      expect(step.ok).toBe(true);
      expect(state.booking?.status).toBe(status);
    }
    expect(state.activeJob).toBeNull();

    const receipt = await recordBookingPayment(mechanic, BOOKING_ID, {
      method: "cod",
      confirmed: true,
      amount: 450000,
    });
    expect(receipt.ok).toBe(true);
    expect(workspaceStubs.paymentWrites[0]?.paymentId).toBe(BOOKING_ID);

    const review = await createBookingReview(customer, BOOKING_ID, {
      rating: 5,
      body: "Tho sua nhanh.",
    });
    expect(review.ok).toBe(true);

    const publishedKinds = workspaceStubs.published.map(
      (entry) => (entry.payload as { kind: string }).kind,
    );
    expect(publishedKinds).toContain("booking-assigned");
    expect(publishedKinds).toContain("payment-recorded");
    expect(publishedKinds).toContain("review-created");
  });

  test("a second mechanic cannot steal the active job mid-route", async () => {
    state.activeJob = BOOKING_ID;
    const second = makeBookingRow({
      booking_id: "66666666-6666-4666-8666-666666666666",
      status: "mechanic_assigned",
      mechanic_id: MECHANIC_ID,
    });
    state.booking = second;
    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      second.booking_id,
      "start-travel",
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(state.activeJob).toBe(BOOKING_ID);
  });

  test("a lost CAS leaves no projections or side effects", async () => {
    state.claimed = false;
    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
    state.booking = makeBookingRow({ status: "pending" });
    const denied = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(denied).toMatchObject({ ok: false, status: 409 });
    expect(mechanicStubs.transitionProjected).toHaveLength(0);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls.length,
    ).toBe(0);
  });
});
