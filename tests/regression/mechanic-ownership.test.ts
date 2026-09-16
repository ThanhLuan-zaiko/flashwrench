import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  MECHANIC_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

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

import { applyMechanicBookingAction } from "@/lib/mechanic/mechanic-bookings.service";

const OTHER_MECHANIC_ID = "99999999-9999-4999-8999-999999999999";

beforeEach(() => {
  resetMechanicMocks();
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

    for (const action of actions) {
      const result = await applyMechanicBookingAction(
        OTHER_MECHANIC_ID,
        BOOKING_ID,
        action,
      );
      expect(result).toMatchObject({ ok: false, status: 403 });
    }
    expect(mechanicBookingsRepoMocks.writeBookingStatus.mock.calls.length).toBe(
      0,
    );
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
    expect(mechanicBookingsRepoMocks.writeBookingStatus.mock.calls.length).toBe(
      1,
    );
  });
});
