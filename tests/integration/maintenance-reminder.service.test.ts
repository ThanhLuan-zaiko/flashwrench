// Daily reminder scan: treatment vehicles get one email per due date, the
// holdout group is claimed without mail, and a failed send releases its
// claim so the next run can retry.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  maintenanceMailMocks,
  maintenanceRepoMocks,
  maintenanceStubs,
  maintenanceUserMocks,
  maintenanceVehicleMocks,
  resetMaintenanceStubs,
} from "../helpers/maintenance-reminder.mocks";

// Helpers first, mocks second, system under test last.
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

import { runMaintenanceReminderScan } from "@/lib/vehicles/maintenance-reminder.service";

process.env.AUTH_SECRET = "test-secret";

const NOW = new Date("2026-10-25T02:00:00.000Z");
const DUE = new Date("2026-11-03T02:00:00.000Z");
const VEHICLE = "11111111-1111-4111-8111-111111111111";
const OWNER = "22222222-2222-4222-8222-222222222222";

function dueRow(vehicleId: string, group = "treatment") {
  return {
    dueMonth: "2026-11",
    dueAt: DUE,
    vehicleId,
    ownerId: OWNER,
    nextDueKm: null,
    reminderGroup: group,
  };
}

beforeEach(() => {
  resetMaintenanceStubs();
});

describe("runMaintenanceReminderScan", () => {
  test("mails the owner once with vehicle name and due date, never the plate", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE)];
    const result = await runMaintenanceReminderScan(NOW);
    expect(result).toEqual({ scanned: 1, sent: 1, holdout: 0, skipped: 0 });
    expect(maintenanceStubs.sentMail).toHaveLength(1);
    const [mail] = maintenanceStubs.sentMail;
    expect(mail?.to).toBe("owner@example.com");
    expect(mail?.subject).toContain("Toyota Vios");
    expect(mail?.text).toContain("03/11/2026");
  });

  test("a rerun in the same window never mails the same due date twice", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE)];
    await runMaintenanceReminderScan(NOW);
    const second = await runMaintenanceReminderScan(NOW);
    expect(second.sent).toBe(0);
    expect(maintenanceStubs.sentMail).toHaveLength(1);
  });

  test("holdout vehicles are claimed in the ledger but never mailed", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE, "holdout")];
    const result = await runMaintenanceReminderScan(NOW);
    expect(result).toEqual({ scanned: 1, sent: 0, holdout: 1, skipped: 0 });
    expect(maintenanceStubs.sentMail).toHaveLength(0);
    const claimKey = `${VEHICLE}|${DUE.toISOString()}`;
    expect(maintenanceStubs.claims.get(claimKey)).toBe("holdout");
  });

  test("a failed send releases its claim so the next run retries", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE)];
    maintenanceStubs.mailFailures = 1;
    const first = await runMaintenanceReminderScan(NOW);
    expect(first.sent).toBe(0);
    expect(maintenanceStubs.claims.size).toBe(0);
    const retry = await runMaintenanceReminderScan(NOW);
    expect(retry.sent).toBe(1);
  });

  test("archived vehicles and owners without email are skipped untouched", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE)];
    maintenanceStubs.vehicle = {
      owner_id: OWNER,
      brand: "Honda",
      model: "City",
      is_archived: true,
      odometer_km: null,
    };
    expect((await runMaintenanceReminderScan(NOW)).skipped).toBe(1);
    expect(maintenanceStubs.claims.size).toBe(0);

    maintenanceStubs.vehicle = {
      owner_id: OWNER,
      brand: "Honda",
      model: "City",
      is_archived: false,
      odometer_km: null,
    };
    maintenanceStubs.owner = null;
    expect((await runMaintenanceReminderScan(NOW)).skipped).toBe(1);
    expect(maintenanceStubs.claims.size).toBe(0);
  });

  test("nothing is claimed while mail is not configured", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE)];
    maintenanceStubs.mailConfigured = false;
    const result = await runMaintenanceReminderScan(NOW);
    expect(result.sent).toBe(0);
    expect(maintenanceStubs.claims.size).toBe(0);
  });

  test("customers who opted out are skipped without a claim", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE)];
    maintenanceStubs.optOut.add(OWNER);
    const result = await runMaintenanceReminderScan(NOW);
    expect(result.sent).toBe(0);
    expect(maintenanceStubs.claims.size).toBe(0);
    expect(maintenanceStubs.sentMail).toHaveLength(0);
  });

  test("the mail carries a working opt-out link", async () => {
    maintenanceStubs.dueRows = [dueRow(VEHICLE)];
    await runMaintenanceReminderScan(NOW);
    const [mail] = maintenanceStubs.sentMail;
    expect(mail?.text).toContain(`/api/maintenance/unsubscribe?u=${OWNER}`);
  });

  test("a window that crosses a month boundary reads both months", async () => {
    await runMaintenanceReminderScan(new Date("2026-10-25T02:00:00.000Z"));
    expect(maintenanceStubs.dueQueries.map((query) => query.month)).toEqual([
      "2026-10",
      "2026-11",
    ]);
  });
});
