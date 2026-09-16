import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingItemRow,
  makeBookingRow,
  makeHistoryRow,
  makeProfileRow,
  makeWorkloadRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicDirectoryRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, matching tests/integration/*.test.ts.
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

import {
  applyMechanicBookingAction,
  getMechanicBookingDetail,
  listMechanicBookings,
} from "@/lib/mechanic/mechanic-bookings.service";

beforeEach(() => {
  resetMechanicMocks();
});

describe("listMechanicBookings", () => {
  test("maps workload rows with details, items and payment state", async () => {
    mechanicStubs.workloadRows = [
      makeWorkloadRow(),
      makeWorkloadRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        status: "completed",
        total: 520000,
      }),
    ];
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({ payment_status: "unpaid" }),
      makeBookingRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        status: "completed",
        payment_status: "paid",
      }),
    ];
    mechanicStubs.itemRows = [makeBookingItemRow()];

    const result = await listMechanicBookings(MECHANIC_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      id: BOOKING_ID,
      status: "pending",
      paymentState: "unpaid",
      serviceNames: ["Thay dau dong co"],
    });
    expect(result.data[1]).toMatchObject({
      status: "completed",
      paymentState: "paid",
      serviceNames: [],
    });
  });

  test("filters by status and skips rows with unknown statuses", async () => {
    mechanicStubs.workloadRows = [
      makeWorkloadRow(),
      makeWorkloadRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        status: "shipped",
      }),
    ];
    mechanicStubs.bookingRowsByIds = [makeBookingRow()];
    mechanicStubs.itemRows = [];

    const filtered = await listMechanicBookings(MECHANIC_ID, {
      status: "completed",
    });
    expect(filtered.ok).toBe(true);
    if (!filtered.ok) return;
    expect(filtered.data).toHaveLength(0);

    const all = await listMechanicBookings(MECHANIC_ID);
    expect(all.ok).toBe(true);
    if (!all.ok) return;
    expect(all.data).toHaveLength(1);
    expect(
      mechanicBookingsRepoMocks.listBookingRowsByIds.mock.calls[1]?.[0],
    ).toEqual([BOOKING_ID]);
  });
});

describe("getMechanicBookingDetail", () => {
  test("returns items, timeline and the cancel reason", async () => {
    mechanicStubs.bookingById = makeBookingRow({ notes: "Call first" });
    mechanicStubs.itemRows = [makeBookingItemRow()];
    mechanicStubs.historyRows = [
      makeHistoryRow(),
      makeHistoryRow({
        changed_at: new Date("2026-09-16T07:30:00.000Z"),
        old_status: "pending",
        new_status: "mechanic_assigned",
        note: "Accepted",
      }),
    ];

    const result = await getMechanicBookingDetail(MECHANIC_ID, BOOKING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.timeline.map((entry) => entry.to)).toEqual([
      "pending",
      "mechanic_assigned",
    ]);
    expect(result.data.notes).toBe("Call first");
  });
  test("rejects other mechanics and unknown bookings", async () => {
    mechanicStubs.bookingById = makeBookingRow();
    expect(
      await getMechanicBookingDetail(MECHANIC_OTHER_ID, BOOKING_ID),
    ).toMatchObject({ ok: false, status: 403 });

    mechanicStubs.bookingById = null;
    expect(
      await getMechanicBookingDetail(MECHANIC_ID, BOOKING_ID),
    ).toMatchObject({ ok: false, status: 404 });
    expect(
      mechanicBookingsRepoMocks.listBookingItemRowsByBookingIds.mock.calls
        .length,
    ).toBe(0);
  });
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
    expect(
      mechanicBookingsRepoMocks.writeBookingStatus.mock.calls[0]?.[0],
    ).toMatchObject({
      bookingId: BOOKING_ID,
      mechanicId: MECHANIC_ID,
      fromStatus: "pending",
      toStatus: "mechanic_assigned",
      monthBucket: "2026-09",
      changedBy: MECHANIC_ID,
    });
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
      mechanicBookingsRepoMocks.writeBookingStatus.mock.calls[1]?.[0],
    ).toMatchObject({ note: "Fixed and tested" });
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
});
