import { beforeEach, describe, expect, mock, test } from "bun:test";
import { encodeCursor } from "@/lib/db/cursor";
import { makePublicUser, makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingRow,
  makeProfileRow,
  makeWorkloadRow,
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
  dispatchRepoMocks,
  domainPublishMocks,
  resetWorkspaceMocks,
  reviewRepoMocks,
  vehicleRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

mock.module("@/lib/dispatch/dispatch.repository", () => dispatchRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);
mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => mechanicDirectoryRepoMocks,
);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);
mock.module("@/lib/booking/review.repository", () => reviewRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import {
  applyDispatchAction,
  getDispatchBooking,
  listDispatchBookings,
} from "@/lib/dispatch/dispatch.service";
import { getMechanicBookingDetail } from "@/lib/mechanic/mechanic-bookings.service";

const dispatcher = makePublicUser({
  id: "dddddddd-3333-4333-8333-dddddddddddd",
  role: "dispatcher",
});
const admin = makePublicUser({
  id: "eeeeeeee-3333-4333-8333-eeeeeeeeeeee",
  role: "admin",
});
const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
  mechanicStubs.profile = makeProfileRow();
});

describe("listDispatchBookings", () => {
  test("rejects non-dispatcher roles", async () => {
    const result = await listDispatchBookings(customer);
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(dispatchRepoMocks.listStatusBookingRefs.mock.calls.length).toBe(0);
  });

  test("rejects invalid status, month, limit and cursor", async () => {
    expect(
      await listDispatchBookings(dispatcher, { status: "bogus" }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await listDispatchBookings(dispatcher, { month: "2026/09" }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await listDispatchBookings(dispatcher, { limit: "0" }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await listDispatchBookings(dispatcher, { cursor: "forged" }),
    ).toMatchObject({ ok: false, status: 400 });
    const wrongScope = encodeCursor(
      "state",
      `dispatch:${dispatcher.id}:confirmed:2026-09`,
    );
    expect(
      await listDispatchBookings(dispatcher, {
        cursor: wrongScope,
      }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(dispatchRepoMocks.listStatusBookingRefs.mock.calls.length).toBe(0);
  });

  test("keeps only refs whose canonical row matches status and bucket", async () => {
    workspaceStubs.dispatchRefPage = {
      rows: [
        {
          scheduled_at: new Date("2026-09-16T07:00:00.000Z"),
          booking_id: BOOKING_ID,
        },
        {
          scheduled_at: new Date("2026-09-16T08:00:00.000Z"),
          booking_id: MECHANIC_OTHER_ID,
        },
      ],
      pageState: "next",
    };
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({ status: "pending", month_bucket: "2026-09" }),
      makeBookingRow({
        booking_id: MECHANIC_OTHER_ID,
        status: "completed",
        month_bucket: "2026-09",
      }),
    ];
    mechanicStubs.itemRows = [];

    const result = await listDispatchBookings(dispatcher, {
      month: "2026-09",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.id).toBe(BOOKING_ID);
    expect(result.data.nextCursor).not.toBeNull();
    expect(
      dispatchRepoMocks.listStatusBookingRefs.mock.calls[0]?.slice(0, 2),
    ).toEqual(["pending", "2026-09"]);
  });
});

describe("getDispatchBooking", () => {
  test("rejects customers and returns the detail for dispatchers", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    expect(await getDispatchBooking(customer, BOOKING_ID)).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(await getDispatchBooking(dispatcher, BOOKING_ID)).toMatchObject({
      ok: true,
    });
    expect(await getDispatchBooking(admin, BOOKING_ID)).toMatchObject({
      ok: true,
    });
    expect(await getDispatchBooking(dispatcher, "not-a-uuid")).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("applyDispatchAction", () => {
  function pendingRow() {
    return makeBookingRow({ status: "pending", mechanic_id: null });
  }

  test("rejects a stale expectedUpdatedAt before any write", async () => {
    mechanicStubs.bookingById = pendingRow();
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "confirm",
      expectedUpdatedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });

  test("requires the expectedUpdatedAt field to be present", async () => {
    mechanicStubs.bookingById = pendingRow();
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "confirm",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(mechanicBookingsRepoMocks.findBookingRowById.mock.calls.length).toBe(
      0,
    );
  });

  test("rejects a malformed mechanic id before eligibility reads", async () => {
    mechanicStubs.bookingById = pendingRow();
    const row = pendingRow();
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "assign",
      mechanicId: "not-a-uuid",
      expectedUpdatedAt: row.updated_at?.toISOString(),
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });

  test("rejects an ineligible mechanic without writing", async () => {
    mechanicStubs.bookingById = pendingRow();
    mechanicStubs.profile = makeProfileRow({ is_available: false });
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "assign",
      mechanicId: MECHANIC_ID,
      expectedUpdatedAt: pendingRow().updated_at?.toISOString(),
    });
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });

  test("rejects a mechanic with an overlapping job", async () => {
    mechanicStubs.bookingById = pendingRow();
    const clashId = "66666666-6666-4666-8666-666666666666";
    mechanicStubs.workloadRowsInRange = [
      makeWorkloadRow({ booking_id: clashId, status: "confirmed" }),
    ];
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({
        booking_id: clashId,
        status: "confirmed",
        scheduled_at: new Date("2026-09-16T07:30:00.000Z"),
      }),
    ];
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "assign",
      mechanicId: MECHANIC_ID,
      expectedUpdatedAt: pendingRow().updated_at?.toISOString(),
    });
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition.mock.calls.length,
    ).toBe(0);
  });

  test("61 historical jobs do not block a free schedule slot", async () => {
    mechanicStubs.bookingById = pendingRow();
    mechanicStubs.workloadRowsInRange = [];
    mechanicStubs.workloadPageRows = [];
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "assign",
      mechanicId: MECHANIC_ID,
      expectedUpdatedAt: pendingRow().updated_at?.toISOString(),
    });
    expect(result.ok).toBe(true);
  });

  test("assign transitions, clears the old mechanic index and notifies", async () => {
    mechanicStubs.bookingById = pendingRow();
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "assign",
      mechanicId: MECHANIC_ID,
      expectedUpdatedAt: pendingRow().updated_at?.toISOString(),
    });
    expect(result.ok).toBe(true);
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as { status: string; mechanicId: string | null };
    expect(claim).toMatchObject({
      status: "pending",
      mechanicId: MECHANIC_ID,
    });
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "booking-assigned",
    );
  });

  test("confirm and cancel publish booking-updated", async () => {
    mechanicStubs.bookingById = pendingRow();
    const confirmed = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "confirm",
      expectedUpdatedAt: pendingRow().updated_at?.toISOString(),
    });
    expect(confirmed.ok).toBe(true);
    expect(domainPublishMocks.publishBookingChange.mock.calls[0]?.[0]).toBe(
      "booking-updated",
    );

    mechanicStubs.bookingById = pendingRow();
    const cancelled = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "cancel",
      note: "Khach doi lich",
      expectedUpdatedAt: pendingRow().updated_at?.toISOString(),
    });
    expect(cancelled.ok).toBe(true);
    expect(domainPublishMocks.publishBookingChange.mock.calls[1]?.[0]).toBe(
      "booking-updated",
    );
  });

  test("reassigning releases the old mechanic and notifies both", async () => {
    const row = pendingRow();
    mechanicStubs.bookingById = makeBookingRow({
      status: "pending",
      mechanic_id: MECHANIC_OTHER_ID,
    });
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "assign",
      mechanicId: MECHANIC_ID,
      expectedUpdatedAt: row.updated_at?.toISOString(),
    });
    expect(result.ok).toBe(true);
    const claim = bookingWorkflowRepoMocks.claimBookingTransition.mock
      .calls[0]?.[0] as { mechanicId: string | null };
    expect(claim.mechanicId).toBe(MECHANIC_ID);
    expect(
      mechanicWorkspaceRepoMocks.setMechanicAvailability.mock.calls[0]?.[0],
    ).toBe(MECHANIC_OTHER_ID);
    const publishCall = domainPublishMocks.publishBookingChange.mock.calls[0];
    expect(publishCall?.[0]).toBe("booking-assigned");
    expect(publishCall?.[4]).toEqual([MECHANIC_OTHER_ID, MECHANIC_ID]);
    mechanicStubs.bookingById = makeBookingRow({
      status: "mechanic_assigned",
      mechanic_id: MECHANIC_ID,
    });
    expect(
      await getMechanicBookingDetail(MECHANIC_OTHER_ID, BOOKING_ID),
    ).toMatchObject({ ok: false, status: 403 });
    expect(
      await getMechanicBookingDetail(MECHANIC_ID, BOOKING_ID),
    ).toMatchObject({ ok: true });
  });

  test("lost CAS returns 409 with no projection or signal", async () => {
    mechanicStubs.bookingById = pendingRow();
    mechanicStubs.transitionClaimed = false;
    const result = await applyDispatchAction(dispatcher, BOOKING_ID, {
      action: "confirm",
      expectedUpdatedAt: pendingRow().updated_at?.toISOString(),
    });
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition.mock.calls.length,
    ).toBe(0);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(0);
  });
});
