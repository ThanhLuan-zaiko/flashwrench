import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
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
  resetWorkspaceMocks,
  vehicleRepoMocks,
} from "../helpers/workspace.mocks";

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);

import { applyMechanicBookingAction } from "@/lib/mechanic/mechanic-bookings.service";

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("applyMechanicBookingAction", () => {
  test("accepts a pending booking and leaves availability alone", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    mechanicStubs.bookingRowsByIds = [makeBookingRow({ status: "pending" })];
    mechanicStubs.itemRows = [];

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.booking.status).toBe("mechanic_assigned");
    expect(result.data.customerId).toBe(CUSTOMER_ID);
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as {
      before: { booking_id: string; status: string };
      status: string;
      mechanicId: string;
      actorId: string;
      monthBucket: string;
    };
    expect(claim).toMatchObject({
      status: "mechanic_assigned",
      mechanicId: MECHANIC_ID,
      actorId: MECHANIC_ID,
      monthBucket: "2026-09",
    });
    expect(claim.before).toMatchObject({
      booking_id: BOOKING_ID,
      status: "pending",
    });
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(1);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls.length,
    ).toBe(0);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicCompletedJobs.mock.calls.length,
    ).toBe(0);
  });

  test("marks the mechanic busy on departure, free on completion", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "mechanic_assigned" });
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({ status: "mechanic_assigned" }),
    ];
    mechanicStubs.itemRows = [];
    mechanicStubs.profile = makeProfileRow({ completed_jobs: 3 });

    const started = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "start-travel",
    );
    expect(started.ok).toBe(true);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls[0]?.slice(
        0,
        2,
      ),
    ).toEqual([MECHANIC_ID, false]);

    mechanicWorkspaceRepoMocks.setMechanicAvailability.mockClear();
    mechanicStubs.bookingById = makeBookingRow({ status: "in_progress" });
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({ status: "in_progress" }),
    ];
    const done = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "complete",
      "  Fixed and tested  ",
    );
    expect(done.ok).toBe(true);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls[0]?.slice(
        0,
        2,
      ),
    ).toEqual([MECHANIC_ID, true]);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicCompletedJobs.mock.calls[0]?.slice(
        0,
        2,
      ),
    ).toEqual([MECHANIC_ID, 4]);
    expect(
      (
        bookingWorkflowRepoMocks.claimBookingTransition.mock.calls[1]?.[0] as {
          note: string;
        }
      ).note,
    ).toBe("Fixed and tested");
  });

  test("decline returns the booking to pending unassigned", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "pending" });
    mechanicStubs.itemRows = [];

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "decline",
      "Too far",
    );
    expect(result.ok).toBe(true);
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as {
      status: string;
      mechanicId: string | null;
      mechanicName: string | null;
    };
    expect(claim).toMatchObject({
      status: "pending",
      mechanicId: null,
      mechanicName: null,
    });
  });

  test("cancel keeps the assigned mechanic but frees reservation+availability", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "en_route" });
    mechanicStubs.activeJob = BOOKING_ID;
    mechanicStubs.itemRows = [];

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "cancel",
      "Khach huy",
    );
    expect(result.ok).toBe(true);
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as {
      status: string;
      mechanicId: string | null;
      mechanicName: string | null;
    };
    expect(claim).toMatchObject({
      status: "cancelled",
      mechanicId: MECHANIC_ID,
      mechanicName: "Nguyen Van A",
    });
    expect(mechanicStubs.activeJobReleased).toEqual([BOOKING_ID]);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls[0]?.slice(
        0,
        2,
      ),
    ).toEqual([MECHANIC_ID, true]);
  });

  test("start-travel is denied while another booking holds the job lock", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      status: "mechanic_assigned",
    });
    mechanicStubs.activeJob = "66666666-6666-4666-8666-666666666666";

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "start-travel",
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(mechanicStubs.activeJobReleased).toEqual([]);
  });

  test("a lost CAS keeps a reservation a concurrent winner already claimed", async () => {
    mechanicStubs.bookingReadQueue = [
      makeBookingRow({ status: "mechanic_assigned" }),
      makeBookingRow({ status: "en_route" }),
    ];
    mechanicStubs.activeJob = null;
    mechanicStubs.transitionClaimed = false;

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "start-travel",
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(mechanicStubs.activeJobReleased).toEqual([]);
  });

  test("a lost CAS releases only a reservation this request acquired", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      status: "mechanic_assigned",
    });
    mechanicStubs.activeJob = null;
    mechanicStubs.transitionClaimed = false;

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "start-travel",
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(mechanicStubs.activeJobReleased).toEqual([BOOKING_ID]);
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls.length,
    ).toBe(0);
  });

  test("guards: unknown action, wrong step, long note, foreign booking", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    expect(
      await applyMechanicBookingAction(MECHANIC_ID, BOOKING_ID, "fly"),
    ).toMatchObject({ ok: false, status: 400 });

    expect(
      await applyMechanicBookingAction(MECHANIC_ID, BOOKING_ID, "complete"),
    ).toMatchObject({ ok: false, status: 400 });

    expect(
      await applyMechanicBookingAction(
        MECHANIC_ID,
        BOOKING_ID,
        "decline",
        "x".repeat(301),
      ),
    ).toMatchObject({ ok: false, status: 400 });

    mechanicStubs.bookingById = makeBookingRow({
      mechanic_id: MECHANIC_OTHER_ID,
    });
    expect(
      await applyMechanicBookingAction(MECHANIC_ID, BOOKING_ID, "accept"),
    ).toMatchObject({ ok: false, status: 403 });
  });

  test("never writes storage when the transition is rejected", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "completed" });
    expect(
      await applyMechanicBookingAction(MECHANIC_ID, BOOKING_ID, "complete"),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls.length,
    ).toBe(0);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicCompletedJobs.mock.calls.length,
    ).toBe(0);
  });
});
