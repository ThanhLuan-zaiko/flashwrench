import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeAvailableMechanicRow,
  makeBookingRow,
  makeHistoryRow,
  makeProfileRow,
} from "../helpers/mechanic.fixtures";
import {
  bookingWorkflowRepoMocks,
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicDirectoryStubs,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { serviceStubs, userRepoMocks } from "../helpers/service-mocks";
import {
  dispatchRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// The auto-dispatcher runs the same repositories the dispatcher console
// uses; only the assignee choice is automated. Everything is stubbed —
// nothing touches a real database.
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
mock.module("@/lib/dispatch/dispatch.repository", () => dispatchRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import {
  autoDispatchBooking,
  redispatchUnassignedBookings,
} from "@/lib/dispatch/auto-dispatch.service";
import { applyMechanicBookingAction } from "@/lib/mechanic/mechanic-bookings.service";

const FUTURE = () => new Date(Date.now() + 2 * 60 * 60 * 1000);

// NEAR sits ~0.4km from the fixture address, FAR ~18km away. The
// directory lists FAR first (better rating); geo order must win.
function unassignedRow() {
  return makeBookingRow({
    mechanic_id: null,
    mechanic_name: null,
    status: "pending",
    scheduled_at: FUTURE(),
  });
}

function seedCandidates() {
  mechanicDirectoryStubs.rows = [
    makeAvailableMechanicRow({
      mechanic_id: MECHANIC_OTHER_ID,
      display_name: "Far but rated",
      base_lat: 10.9,
      base_lng: 106.8,
      rating_avg: 5,
    }),
    makeAvailableMechanicRow({ mechanic_id: MECHANIC_ID }),
  ];
  mechanicStubs.profilesById.set(
    MECHANIC_ID,
    makeProfileRow({ mechanic_id: MECHANIC_ID, display_name: "Tho Gan" }),
  );
  mechanicStubs.profilesById.set(
    MECHANIC_OTHER_ID,
    makeProfileRow({
      mechanic_id: MECHANIC_OTHER_ID,
      display_name: "Tho Xa",
      base_lat: 10.9,
      base_lng: 106.8,
    }),
  );
}

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
});

describe("autoDispatchBooking", () => {
  test("offers the nearest eligible mechanic and publishes the offer", async () => {
    mechanicStubs.bookingById = unassignedRow();
    seedCandidates();

    const outcome = await autoDispatchBooking(BOOKING_ID);

    expect(outcome).toEqual({
      mechanicId: MECHANIC_ID,
      mechanicName: "Tho Gan",
    });
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as {
      status: string;
      mechanicId: string | null;
      actorId: string;
      note: string | null;
    };
    expect(claim).toMatchObject({
      status: "pending",
      mechanicId: MECHANIC_ID,
      actorId: "00000000-0000-0000-0000-000000000000",
    });
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "booking-assigned",
    );
  });

  test("never re-offers a mechanic who already declined", async () => {
    mechanicStubs.bookingById = unassignedRow();
    seedCandidates();
    mechanicStubs.historyRows = [
      makeHistoryRow({ new_status: "pending", changed_by: MECHANIC_ID }),
    ];

    const outcome = await autoDispatchBooking(BOOKING_ID);

    expect(outcome?.mechanicId).toBe(MECHANIC_OTHER_ID);
  });

  test("returns null without writing when nothing is dispatchable", async () => {
    mechanicStubs.bookingById = null;
    expect(await autoDispatchBooking(BOOKING_ID)).toBeNull();

    mechanicStubs.bookingById = makeBookingRow({ status: "en_route" });
    expect(await autoDispatchBooking(BOOKING_ID)).toBeNull();

    // A customer-picked mechanic already holds the offer.
    mechanicStubs.bookingById = unassignedRow();
    mechanicStubs.bookingById.mechanic_id = MECHANIC_ID;
    expect(await autoDispatchBooking(BOOKING_ID)).toBeNull();

    // A slot in the past is left for a human to reschedule or cancel.
    mechanicStubs.bookingById = unassignedRow();
    mechanicStubs.bookingById.scheduled_at = new Date(Date.now() - 60_000);
    expect(await autoDispatchBooking(BOOKING_ID)).toBeNull();

    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });

  test("returns null when every candidate is busy", async () => {
    mechanicStubs.bookingById = unassignedRow();
    seedCandidates();
    mechanicStubs.activeJob = "someone-else";
    expect(await autoDispatchBooking(BOOKING_ID)).toBeNull();
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });

  test("skips a conflicting candidate and offers the next nearest", async () => {
    mechanicStubs.bookingById = unassignedRow();
    seedCandidates();
    // NEAR has another non-terminal booking inside the overlap window;
    // FAR does not — the offer must move past the conflicted mechanic.
    mechanicStubs.workloadRowsInRange = [
      {
        mechanic_id: MECHANIC_ID,
        scheduled_at: FUTURE(),
        booking_id: "66666666-6666-4666-8666-666666666666",
        status: "confirmed",
        total: 100000,
        vehicle_plate: "51A-1",
        customer_name: "Khach",
      },
    ];
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({
        booking_id: "66666666-6666-4666-8666-666666666666",
        mechanic_id: MECHANIC_ID,
        status: "confirmed",
        scheduled_at: FUTURE(),
      }),
    ];

    const outcome = await autoDispatchBooking(BOOKING_ID);
    expect(outcome?.mechanicId).toBe(MECHANIC_OTHER_ID);
  });

  test("a lost CAS claim stays quiet and publishes nothing", async () => {
    mechanicStubs.bookingById = unassignedRow();
    seedCandidates();
    mechanicStubs.transitionClaimed = false;

    expect(await autoDispatchBooking(BOOKING_ID)).toBeNull();
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });
});

describe("decline re-dispatch", () => {
  test("a declined offer moves to the next nearest mechanic", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      status: "pending",
      mechanic_id: MECHANIC_ID,
      scheduled_at: FUTURE(),
    });
    mechanicStubs.itemRows = [];
    seedCandidates();

    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "decline",
      "Ban dang ban",
    );

    expect(result.ok).toBe(true);
    // Claim 1 releases the offer (pending + no mechanic); claim 2 is the
    // auto-dispatch re-offer to the other candidate.
    const claims = bookingWorkflowRepoMocks.claimBookingTransition.mock.calls;
    expect(claims.length).toBe(2);
    expect(claims[1]?.[0]).toMatchObject({ mechanicId: MECHANIC_OTHER_ID });
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "booking-assigned",
    );
  });
});

describe("redispatchUnassignedBookings", () => {
  test("sweeps the pending queue when capacity comes online", async () => {
    workspaceStubs.dispatchRefPage = {
      rows: [{ booking_id: BOOKING_ID, scheduled_at: FUTURE() }],
      pageState: null,
    };
    mechanicStubs.bookingRowsByIds = [unassignedRow()];
    mechanicStubs.bookingById = unassignedRow();
    seedCandidates();

    expect(await redispatchUnassignedBookings()).toBe(1);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });

  test("leaves already-assigned and empty queues alone", async () => {
    workspaceStubs.dispatchRefPage = { rows: [], pageState: null };
    expect(await redispatchUnassignedBookings()).toBe(0);

    workspaceStubs.dispatchRefPage = {
      rows: [{ booking_id: BOOKING_ID, scheduled_at: FUTURE() }],
      pageState: null,
    };
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({ mechanic_id: MECHANIC_ID, scheduled_at: FUTURE() }),
    ];
    expect(await redispatchUnassignedBookings()).toBe(0);
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });
});
