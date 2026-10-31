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
import {
  autoGrantServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";
import { resetAutoRuleMocks } from "../helpers/voucher-auto.mocks";
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
mock.module("@/lib/vouchers/auto-grant.service", () => autoGrantServiceMocks);

import { applyMechanicBookingAction } from "@/lib/mechanic/mechanic-bookings.service";

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  resetAutoRuleMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("mechanic no-show grace window", () => {
  test("no-show is refused inside the grace window after the slot", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      status: "en_route",
      scheduled_at: new Date(Date.now() - 5 * 60_000),
    });
    mechanicStubs.activeJob = BOOKING_ID;

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "mark-no-show",
      "Khach khong co mat",
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition,
    ).not.toHaveBeenCalled();
  });

  test("no-show is accepted once the grace window has passed", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      status: "en_route",
      scheduled_at: new Date(Date.now() - 60 * 60_000),
    });
    mechanicStubs.activeJob = BOOKING_ID;
    mechanicStubs.itemRows = [];

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "mark-no-show",
      "Khach khong co mat",
    );
    expect(result.ok).toBe(true);
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as { status: string } | undefined;
    expect(claim?.status).toBe("no_show");
  });
});
