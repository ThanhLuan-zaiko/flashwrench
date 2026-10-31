// Visit completion keeps the due index in step: the previous due row is
// removed, the new one is written for a known owner, and guests get none.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  maintenanceRepoMocks,
  maintenanceStubs,
  resetMaintenanceStubs,
} from "../helpers/maintenance-reminder.mocks";

mock.module(
  "@/lib/vehicles/maintenance-reminder.repository",
  () => maintenanceRepoMocks,
);

import {
  planVisitDue,
  syncDueIndex,
} from "@/lib/vehicles/maintenance-due.service";

const VEHICLE = "11111111-1111-4111-8111-111111111111";
const OWNER = "22222222-2222-4222-8222-222222222222";
const SERVED = new Date("2026-10-01T03:00:00.000Z");

beforeEach(() => {
  resetMaintenanceStubs();
});

describe("planVisitDue + syncDueIndex", () => {
  test("writes the next due row and removes the previous one", async () => {
    maintenanceStubs.latestVisit = {
      recordId: "r0",
      servedAt: new Date("2026-04-01T00:00:00.000Z"),
      sourceType: "booking",
      sourceId: null,
      odometerKm: 37000,
      nextDueAt: new Date("2026-10-15T00:00:00.000Z"),
      nextDueKm: null,
    };
    maintenanceStubs.cadences = [
      { intervalMonths: 6, intervalKm: 5000 },
      { intervalMonths: 12, intervalKm: 15000 },
    ];
    const plan = await planVisitDue({
      vehicleId: VEHICLE,
      servedAt: SERVED,
      odometerKm: 42000,
      serviceIds: ["s1", "s2"],
    });
    expect(plan.next.dueAt?.toISOString()).toBe("2027-04-01T03:00:00.000Z");
    expect(plan.next.dueKm).toBe(47000);

    await syncDueIndex({ vehicleId: VEHICLE, ownerId: OWNER, plan });
    expect(maintenanceStubs.deletedDue).toHaveLength(1);
    expect(maintenanceStubs.upsertedDue).toHaveLength(1);
    expect(maintenanceStubs.upsertedDue[0]?.dueMonth).toBe("2027-04");
    expect(maintenanceStubs.upsertedDue[0]?.ownerId).toBe(OWNER);
  });

  test("a guest visit writes no due row", async () => {
    maintenanceStubs.cadences = [{ intervalMonths: 6, intervalKm: null }];
    const plan = await planVisitDue({
      vehicleId: VEHICLE,
      servedAt: SERVED,
      odometerKm: null,
      serviceIds: ["s1"],
    });
    await syncDueIndex({ vehicleId: VEHICLE, ownerId: null, plan });
    expect(maintenanceStubs.upsertedDue).toHaveLength(0);
  });

  test("a failed lookup never fails the completion", async () => {
    maintenanceRepoMocks.findLatestVisit.mockImplementationOnce(async () => {
      throw new Error("scylla down");
    });
    const plan = await planVisitDue({
      vehicleId: VEHICLE,
      servedAt: SERVED,
      odometerKm: 42000,
      serviceIds: ["s1"],
    });
    expect(plan).toEqual({
      previousDueAt: null,
      next: { dueAt: null, dueKm: null },
    });
  });

  test("services without cadence leave no due date", async () => {
    maintenanceStubs.cadences = [{ intervalMonths: null, intervalKm: null }];
    const plan = await planVisitDue({
      vehicleId: VEHICLE,
      servedAt: SERVED,
      odometerKm: 42000,
      serviceIds: ["s1"],
    });
    expect(plan.next).toEqual({ dueAt: null, dueKm: null });
  });
});
