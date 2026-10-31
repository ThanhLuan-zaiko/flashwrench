// Backfill: only the newest booking visit without due values is re-planned,
// archived and guest vehicles are skipped, and a rerun writes nothing new.
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

import { backfillVehicleDue } from "@/lib/vehicles/maintenance-backfill.service";

const VEHICLE = "11111111-1111-4111-8111-111111111111";
const OWNER = "22222222-2222-4222-8222-222222222222";

const LEGACY_VISIT = {
  recordId: "rec-1",
  servedAt: new Date("2026-04-01T03:00:00.000Z"),
  sourceType: "booking",
  sourceId: "booking-1",
  odometerKm: 42000,
  nextDueAt: null,
  nextDueKm: null,
};

const ACTIVE = { vehicleId: VEHICLE, ownerId: OWNER, isArchived: false };

beforeEach(() => {
  resetMaintenanceStubs();
  maintenanceStubs.bookingServices = ["svc-oil"];
  maintenanceStubs.cadences = [{ intervalMonths: 6, intervalKm: 5000 }];
  maintenanceStubs.latestVisit = LEGACY_VISIT;
});

describe("backfillVehicleDue", () => {
  test("plans and stores the due values for a legacy booking visit", async () => {
    expect(await backfillVehicleDue(ACTIVE)).toBe("written");
    expect(maintenanceRepoMocks.setVisitNextDue.mock.calls).toHaveLength(1);
    expect(maintenanceStubs.upsertedDue).toHaveLength(1);
    expect(maintenanceStubs.upsertedDue[0]?.dueMonth).toBe("2026-10");
  });

  test("a visit that already has due values is left alone", async () => {
    maintenanceStubs.latestVisit = {
      ...LEGACY_VISIT,
      nextDueAt: new Date("2026-10-01T00:00:00.000Z"),
    };
    expect(await backfillVehicleDue(ACTIVE)).toBe("skipped");
    expect(maintenanceStubs.upsertedDue).toHaveLength(0);
  });

  test("archived and guest-owned vehicles are skipped", async () => {
    expect(await backfillVehicleDue({ ...ACTIVE, isArchived: true })).toBe(
      "skipped",
    );
    expect(await backfillVehicleDue({ ...ACTIVE, ownerId: null })).toBe(
      "skipped",
    );
    expect(maintenanceStubs.upsertedDue).toHaveLength(0);
  });

  test("visits without a booking source are skipped", async () => {
    maintenanceStubs.latestVisit = { ...LEGACY_VISIT, sourceType: "emergency" };
    expect(await backfillVehicleDue(ACTIVE)).toBe("skipped");
  });

  test("services with no cadence write nothing", async () => {
    maintenanceStubs.cadences = [{ intervalMonths: null, intervalKm: null }];
    expect(await backfillVehicleDue(ACTIVE)).toBe("skipped");
    expect(maintenanceRepoMocks.setVisitNextDue.mock.calls).toHaveLength(0);
  });
});
