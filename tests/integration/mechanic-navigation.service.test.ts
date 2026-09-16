import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  MECHANIC_ID,
  makeBookingItemRow,
  makeBookingRow,
  makeLocationRow,
  makeProfileRow,
  makeWorkloadRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
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

import {
  getNavigationBoard,
  saveMechanicLocation,
} from "@/lib/mechanic/mechanic-navigation.service";

beforeEach(() => {
  resetMechanicMocks();
});

describe("getNavigationBoard", () => {
  test("builds targets with distance and ETA from the live GPS origin", async () => {
    mechanicStubs.workloadRows = [
      makeWorkloadRow({ status: "en_route" }),
      makeWorkloadRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        status: "completed",
      }),
    ];
    mechanicStubs.location = makeLocationRow({
      lat: 10.77,
      lng: 106.7,
      current_job_id: BOOKING_ID,
      current_job_type: "booking",
    });
    mechanicStubs.profile = makeProfileRow();
    mechanicStubs.bookingRowsByIds = [makeBookingRow({ status: "en_route" })];
    mechanicStubs.itemRows = [makeBookingItemRow()];

    const result = await getNavigationBoard(MECHANIC_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.origin).toMatchObject({
      lat: 10.77,
      lng: 106.7,
      label: "Vị trí hiện tại của bạn",
    });
    expect(result.data.currentJobId).toBe(BOOKING_ID);
    expect(result.data.currentJobType).toBe("booking");
    expect(result.data.targets).toHaveLength(1);
    expect(result.data.targets[0]).toMatchObject({
      bookingId: BOOKING_ID,
      status: "en_route",
      serviceNames: ["Thay dau dong co"],
    });
    expect(result.data.targets[0]?.distanceKm).toBeGreaterThan(0);
    expect(result.data.targets[0]?.etaMin).toBeGreaterThan(0);
  });

  test("falls back to the garage base and skips jobs without addresses", async () => {
    mechanicStubs.workloadRows = [makeWorkloadRow({ status: "confirmed" })];
    mechanicStubs.location = null;
    mechanicStubs.profile = makeProfileRow();
    mechanicStubs.bookingRowsByIds = [
      makeBookingRow({ status: "confirmed", address: null }),
    ];
    mechanicStubs.itemRows = [];

    const result = await getNavigationBoard(MECHANIC_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.origin).toMatchObject({
      label: "Điểm xuất phát (xưởng)",
    });
    expect(result.data.targets).toEqual([]);
    expect(result.data.currentJobId).toBe(BOOKING_ID);
  });
});

describe("saveMechanicLocation", () => {
  test("saves a valid GPS fix with its timestamp", async () => {
    const result = await saveMechanicLocation(MECHANIC_ID, {
      latitude: 10.775,
      longitude: 106.701,
      currentJobId: BOOKING_ID,
      currentJobType: "booking",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      lat: 10.775,
      lng: 106.701,
      currentJobId: BOOKING_ID,
      currentJobType: "booking",
    });
    expect(
      mechanicWorkspaceRepoMocks.upsertMechanicLocation.mock.calls[0]?.[0],
    ).toMatchObject({ mechanicId: MECHANIC_ID, currentJobType: "booking" });
  });

  test("rejects bad coordinates without touching storage", async () => {
    const result = await saveMechanicLocation(MECHANIC_ID, {
      latitude: 91,
      longitude: "east",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    if (result.ok) return;
    expect(result.errors.latitude).toBeDefined();
    expect(result.errors.longitude).toBeDefined();
    expect(
      mechanicWorkspaceRepoMocks.upsertMechanicLocation.mock.calls.length,
    ).toBe(0);
  });
});
