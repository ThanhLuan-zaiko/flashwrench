import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  MECHANIC_ID,
  makeBookingRow,
  makeWorkloadRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);

import { mechanicScheduleConflict } from "@/lib/mechanic/mechanic-assignment.service";

const AT = new Date("2026-10-08T07:00:00.000Z");
const OTHER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function seedOther(
  offsetMin: number,
  durationMin: number | null,
  status = "confirmed",
) {
  const scheduledAt = new Date(AT.getTime() + offsetMin * 60000);
  mechanicStubs.workloadRowsInRange = [
    makeWorkloadRow({ booking_id: OTHER_ID, scheduled_at: scheduledAt }),
  ];
  mechanicStubs.bookingRowsByIds = [
    makeBookingRow({
      booking_id: OTHER_ID,
      scheduled_at: scheduledAt,
      duration_min: durationMin,
      status,
    }),
  ];
}

beforeEach(resetMechanicMocks);

describe("mechanic scheduling with complete visit durations", () => {
  test("a long requested visit conflicts with a later booking", async () => {
    seedOther(120, 60);
    expect(
      await mechanicScheduleConflict(MECHANIC_ID, AT, undefined, 180),
    ).toBe(true);
    const call =
      mechanicBookingsRepoMocks.listWorkloadRowsInRange.mock.calls[0];
    expect(call[2].getTime()).toBeGreaterThanOrEqual(
      AT.getTime() + 180 * 60000,
    );
  });

  test("a long existing visit conflicts even if its start is hours earlier", async () => {
    seedOther(-180, 240);
    expect(await mechanicScheduleConflict(MECHANIC_ID, AT, undefined, 60)).toBe(
      true,
    );
    const call =
      mechanicBookingsRepoMocks.listWorkloadRowsInRange.mock.calls[0];
    expect(call[1].getTime()).toBeLessThanOrEqual(AT.getTime() - 180 * 60000);
  });

  test("separated visits and terminal bookings do not block a mechanic", async () => {
    seedOther(-180, 60);
    expect(await mechanicScheduleConflict(MECHANIC_ID, AT, undefined, 60)).toBe(
      false,
    );
    seedOther(120, 60, "completed");
    expect(
      await mechanicScheduleConflict(MECHANIC_ID, AT, undefined, 180),
    ).toBe(false);
  });

  test("legacy bookings retain the conservative one-hour window", async () => {
    seedOther(-60, null);
    expect(await mechanicScheduleConflict(MECHANIC_ID, AT)).toBe(true);
  });

  test("excludes the current booking when checking a reassignment", async () => {
    seedOther(0, 180);
    expect(await mechanicScheduleConflict(MECHANIC_ID, AT, OTHER_ID, 180)).toBe(
      false,
    );
  });
});
