import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  MECHANIC_ID,
  makeBookingRow,
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

// Regression: the service layer must stop a mechanic from touching another
// mechanic's booking without writing anything to storage. Mocks prove the
// "proof storage is untouched" half; the transition guard is real code.
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

const OTHER_MECHANIC_ID = "99999999-9999-4999-8999-999999999999";

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("mechanic ownership guard", () => {
  test("a foreign booking is a 403 for every action of the workflow", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "pending" });
    const actions = [
      "accept",
      "decline",
      "start-travel",
      "start-work",
      "complete",
      "cancel",
      "mark-no-show",
    ] as const;

    const noteActions = new Set(["decline", "cancel", "mark-no-show"]);
    for (const action of actions) {
      const result = await applyMechanicBookingAction(
        OTHER_MECHANIC_ID,
        BOOKING_ID,
        action,
        noteActions.has(action) ? "foreign mechanic probe" : undefined,
      );
      expect(result).toMatchObject({ ok: false, status: 403 });
    }
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

  test("the owner can still move the same booking forward", async () => {
    mechanicStubs.bookingById = makeBookingRow({ status: "pending" });
    mechanicStubs.bookingRowsByIds = [makeBookingRow()];
    mechanicStubs.itemRows = [];

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(result.ok).toBe(true);
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(1);
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(1);
  });
});
