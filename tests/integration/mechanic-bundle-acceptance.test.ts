import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BOOKING_ID,
  MECHANIC_ID,
  makeBookingItemRow,
  makeBookingRow,
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

import { applyMechanicBookingAction } from "@/lib/mechanic/mechanic-bookings.service";

const OTHER_ID = "88888888-8888-4888-8888-888888888888";
const START = new Date("2026-09-16T12:00:00.000Z");

function seedOther(start: string, durationMin: number) {
  mechanicStubs.workloadRowsInRange = [
    makeWorkloadRow({
      booking_id: OTHER_ID,
      scheduled_at: new Date(start),
      status: "mechanic_assigned",
    }),
  ];
  mechanicStubs.bookingRowsByIds = [
    makeBookingRow({
      booking_id: OTHER_ID,
      scheduled_at: new Date(start),
      status: "mechanic_assigned",
      duration_min: durationMin,
    }),
  ];
}

beforeEach(() => {
  resetMechanicMocks();
  mechanicStubs.bookingById = makeBookingRow({
    scheduled_at: START,
    duration_min: 180,
    subtotal: 300000,
    total: 300000,
  });
  mechanicStubs.itemRows = [
    makeBookingItemRow({
      service_name: "Thay dầu động cơ",
      unit_price: 199000,
      line_total: 199000,
      duration_min: 60,
    }),
    makeBookingItemRow({
      service_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      service_name: "Kiểm tra phanh",
      unit_price: 101000,
      line_total: 101000,
      duration_min: 120,
    }),
  ];
});

describe("accepting a multi-service appointment", () => {
  test("rechecks the entire requested visit before accepting an old offer", async () => {
    seedOther("2026-09-16T14:00:00.000Z", 60);
    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition,
    ).not.toHaveBeenCalled();
    expect(
      bookingWorkflowRepoMocks.projectBookingTransition,
    ).not.toHaveBeenCalled();
  });

  test("also rejects a long existing appointment that covers the offer", async () => {
    seedOther("2026-09-16T10:00:00.000Z", 240);
    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition,
    ).not.toHaveBeenCalled();
  });

  test("accepts a non-overlapping appointment once for every selected item", async () => {
    seedOther("2026-09-16T15:30:00.000Z", 60);
    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.booking.durationMin).toBe(180);
    expect(result.data.booking.serviceNames).toHaveLength(2);
    expect(result.data.booking.serviceNames).toEqual(
      expect.arrayContaining(["Thay dầu động cơ", "Kiểm tra phanh"]),
    );
    expect(result.data.booking).toMatchObject({
      subtotal: 300000,
      discount: 0,
      travelFee: 0,
      total: 300000,
    });
    expect(
      bookingWorkflowRepoMocks.claimBookingTransition,
    ).toHaveBeenCalledTimes(1);
  });

  test("keeps the conservative duration and null display for legacy bookings", async () => {
    mechanicStubs.bookingById = makeBookingRow({
      scheduled_at: START,
      duration_min: null,
    });
    seedOther("2026-09-16T13:30:00.000Z", 60);
    const result = await applyMechanicBookingAction(
      MECHANIC_ID,
      BOOKING_ID,
      "accept",
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.booking.durationMin).toBeNull();
  });
});
