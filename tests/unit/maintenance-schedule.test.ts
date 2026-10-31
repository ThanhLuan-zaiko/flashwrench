// Pure cadence math: shortest interval wins, km needs an odometer reading,
// months are shop-local, and the holdout split is stable and about 10%.
import { describe, expect, test } from "bun:test";
import {
  computeNextDue,
  dueMonthOf,
  HOLDOUT_PERCENT,
  isHoldoutVehicle,
} from "@/lib/vehicles/maintenance-schedule";

const SERVED = new Date("2026-10-01T03:00:00.000Z");

describe("computeNextDue", () => {
  test("the shortest month interval sets the due date", () => {
    const due = computeNextDue({
      servedAt: SERVED,
      odometerKm: null,
      cadences: [
        { intervalMonths: 12, intervalKm: null },
        { intervalMonths: 6, intervalKm: null },
      ],
    });
    expect(due.dueAt?.toISOString()).toBe("2027-04-01T03:00:00.000Z");
    expect(due.dueKm).toBeNull();
  });

  test("km due needs an odometer reading", () => {
    const due = computeNextDue({
      servedAt: SERVED,
      odometerKm: null,
      cadences: [{ intervalMonths: null, intervalKm: 5000 }],
    });
    expect(due).toEqual({ dueAt: null, dueKm: null });
  });

  test("the shortest km interval adds to the odometer", () => {
    const due = computeNextDue({
      servedAt: SERVED,
      odometerKm: 42000,
      cadences: [
        { intervalMonths: null, intervalKm: 15000 },
        { intervalMonths: null, intervalKm: 5000 },
      ],
    });
    expect(due.dueKm).toBe(47000);
  });

  test("no cadence means no due date", () => {
    expect(
      computeNextDue({ servedAt: SERVED, odometerKm: 1, cadences: [] }),
    ).toEqual({ dueAt: null, dueKm: null });
  });

  test("non-positive intervals are ignored", () => {
    const due = computeNextDue({
      servedAt: SERVED,
      odometerKm: 1000,
      cadences: [{ intervalMonths: 0, intervalKm: -5 }],
    });
    expect(due).toEqual({ dueAt: null, dueKm: null });
  });
});

describe("dueMonthOf", () => {
  test("uses the shop-local month, not UTC", () => {
    // 2026-10-31 18:00 UTC is already 2026-11-01 in Ho Chi Minh City.
    expect(dueMonthOf(new Date("2026-10-31T18:00:00.000Z"))).toBe("2026-11");
    expect(dueMonthOf(new Date("2026-10-15T00:00:00.000Z"))).toBe("2026-10");
  });
});

describe("isHoldoutVehicle", () => {
  test("is stable for the same vehicle", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(isHoldoutVehicle(id)).toBe(isHoldoutVehicle(id));
  });

  test("puts roughly the configured share of vehicles in holdout", () => {
    let holdout = 0;
    const total = 5000;
    for (let i = 0; i < total; i += 1) {
      const id = `00000000-0000-4000-8000-${i.toString().padStart(12, "0")}`;
      if (isHoldoutVehicle(id)) holdout += 1;
    }
    const share = (holdout / total) * 100;
    expect(HOLDOUT_PERCENT).toBe(10);
    expect(share).toBeGreaterThan(8);
    expect(share).toBeLessThan(12);
  });
});
