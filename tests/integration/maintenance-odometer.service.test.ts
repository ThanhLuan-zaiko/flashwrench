// Odometer reminders: fire once when a saved reading reaches the km due,
// never while the feature is off, and never for time-based visits.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  maintenanceMailMocks,
  maintenanceRepoMocks,
  maintenanceStubs,
  maintenanceUserMocks,
  maintenanceVehicleMocks,
  resetMaintenanceStubs,
} from "../helpers/maintenance-reminder.mocks";

mock.module(
  "@/lib/vehicles/maintenance-reminder.repository",
  () => maintenanceRepoMocks,
);
mock.module("@/lib/vehicles/vehicle.repository", () => maintenanceVehicleMocks);
mock.module("@/lib/auth/user.repository", () => maintenanceUserMocks);
mock.module("@/lib/mail/mail.config", () => ({
  isMailConfigured: maintenanceMailMocks.isMailConfigured,
}));
mock.module("@/lib/mail/mailer.service", () => ({
  sendMail: maintenanceMailMocks.sendMail,
}));

import { remindOnOdometer } from "@/lib/vehicles/maintenance-odometer.service";

const VEHICLE = "11111111-1111-4111-8111-111111111111";
const SERVED = new Date("2026-04-01T03:00:00.000Z");

function kmVisit(nextDueKm: number | null, nextDueAt: Date | null = null) {
  return {
    recordId: "r1",
    servedAt: SERVED,
    sourceType: "booking",
    sourceId: null,
    odometerKm: 42000,
    nextDueAt,
    nextDueKm,
  };
}

beforeEach(() => {
  resetMaintenanceStubs();
  process.env.AUTH_SECRET = "test-secret";
  process.env.MAINTENANCE_REMINDERS_ENABLED = "true";
});

describe("remindOnOdometer", () => {
  test("fires once when the reading reaches the km due", async () => {
    maintenanceStubs.latestVisit = kmVisit(47000);
    expect(await remindOnOdometer(VEHICLE, 46999)).toBe("none");
    expect(await remindOnOdometer(VEHICLE, 47000)).toBe("sent");
    expect(maintenanceStubs.sentMail).toHaveLength(1);
    expect(maintenanceStubs.sentMail[0]?.text).toContain("47.000 km");
    expect(await remindOnOdometer(VEHICLE, 48000)).toBe("skipped");
    expect(maintenanceStubs.sentMail).toHaveLength(1);
  });

  test("does nothing while the feature flag is off", async () => {
    process.env.MAINTENANCE_REMINDERS_ENABLED = "false";
    maintenanceStubs.latestVisit = kmVisit(47000);
    expect(await remindOnOdometer(VEHICLE, 50000)).toBe("none");
    expect(maintenanceStubs.sentMail).toHaveLength(0);
  });

  test("a time-based visit is left to the daily scan", async () => {
    maintenanceStubs.latestVisit = kmVisit(
      47000,
      new Date("2027-04-01T03:00:00.000Z"),
    );
    expect(await remindOnOdometer(VEHICLE, 50000)).toBe("none");
  });

  test("a missing reading or visit does nothing", async () => {
    maintenanceStubs.latestVisit = kmVisit(47000);
    expect(await remindOnOdometer(VEHICLE, null)).toBe("none");
    maintenanceStubs.latestVisit = null;
    expect(await remindOnOdometer(VEHICLE, 50000)).toBe("none");
  });
});
