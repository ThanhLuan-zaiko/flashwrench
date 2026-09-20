import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingItemRow,
  makeBookingRow,
  makeHistoryRow,
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
  resetWorkspaceMocks,
  vehicleRepoMocks,
} from "../helpers/workspace.mocks";

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
mock.module(
  "@/lib/booking/booking-workflow.repository",
  () => bookingWorkflowRepoMocks,
);
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/vehicles/vehicle.repository", () => vehicleRepoMocks);

import {
  getMechanicBookingDetail,
  listMechanicBookings,
} from "@/lib/mechanic/mechanic-bookings.service";

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  serviceStubs.userById = makeUserRow({ role: "mechanic", status: "active" });
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
    ).toEqual([BOOKING_ID, "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb"]);
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
