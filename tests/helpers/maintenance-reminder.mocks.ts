// Shared repository/service stubs for the maintenance reminder suites. The
// claim map behaves like the real IF NOT EXISTS ledger, so retry and
// double-run paths hit storage-like semantics instead of canned booleans.
import { mock } from "bun:test";
import type {
  DueRow,
  LatestVisit,
} from "@/lib/vehicles/maintenance-reminder.repository";
import type { ServiceCadence } from "@/lib/vehicles/maintenance-schedule";

export const maintenanceStubs = {
  dueRows: [] as DueRow[],
  dueQueries: [] as { month: string; from: Date; to: Date }[],
  // Keyed "vehicleId|dueAtISO"; value is the reminder group.
  claims: new Map<string, string>(),
  cadences: [] as ServiceCadence[],
  bookingServices: [] as string[],
  latestVisit: null as LatestVisit | null,
  optOut: new Set<string>(),
  deletedDue: [] as { month: string; dueAt: Date; vehicleId: string }[],
  upsertedDue: [] as DueRow[],
  vehicle: null as {
    owner_id: string | null;
    brand: string | null;
    model: string | null;
    is_archived: boolean | null;
    odometer_km: number | null;
  } | null,
  owner: null as { email: string } | null,
  mailConfigured: true,
  sentMail: [] as { to: string; subject: string; text: string }[],
  mailFailures: 0,
};

export function resetMaintenanceStubs(): void {
  maintenanceStubs.dueRows = [];
  maintenanceStubs.dueQueries = [];
  maintenanceStubs.claims = new Map();
  maintenanceStubs.cadences = [];
  maintenanceStubs.bookingServices = [];
  maintenanceStubs.latestVisit = null;
  maintenanceStubs.optOut = new Set();
  maintenanceStubs.deletedDue = [];
  maintenanceStubs.upsertedDue = [];
  maintenanceStubs.vehicle = {
    owner_id: "22222222-2222-4222-8222-222222222222",
    brand: "Toyota",
    model: "Vios",
    is_archived: false,
    odometer_km: 42000,
  };
  maintenanceStubs.owner = { email: "owner@example.com" };
  maintenanceStubs.mailConfigured = true;
  maintenanceStubs.sentMail = [];
  maintenanceStubs.mailFailures = 0;
  for (const fn of Object.values(maintenanceRepoMocks)) fn.mockClear();
}

function claimKey(vehicleId: string, dueAt: Date): string {
  return `${vehicleId}|${dueAt.toISOString()}`;
}

export const maintenanceRepoMocks = {
  listDueRows: mock(async (month: string, from: Date, to: Date) => {
    maintenanceStubs.dueQueries.push({ month, from, to });
    return maintenanceStubs.dueRows.filter(
      (row) =>
        row.dueMonth === month &&
        row.dueAt.getTime() >= from.getTime() &&
        row.dueAt.getTime() <= to.getTime(),
    );
  }),
  claimReminder: mock(
    async (params: {
      vehicleId: string;
      reminderKey: Date;
      reminderGroup: string;
    }) => {
      const key = claimKey(params.vehicleId, params.reminderKey);
      if (maintenanceStubs.claims.has(key)) return false;
      maintenanceStubs.claims.set(key, params.reminderGroup);
      return true;
    },
  ),
  releaseReminderClaim: mock(async (vehicleId: string, dueAt: Date) => {
    maintenanceStubs.claims.delete(claimKey(vehicleId, dueAt));
  }),
  findBookingServiceIds: mock(async () => maintenanceStubs.bookingServices),
  findServiceCadences: mock(async () => maintenanceStubs.cadences),
  findLatestVisit: mock(async () => maintenanceStubs.latestVisit),
  findReminderOptOut: mock(async (userId: string) =>
    maintenanceStubs.optOut.has(userId),
  ),
  setVisitNextDue: mock(async () => undefined),
  setReminderOptOut: mock(async () => undefined),
  deleteDueRow: mock(async (month: string, dueAt: Date, vehicleId: string) => {
    maintenanceStubs.deletedDue.push({ month, dueAt, vehicleId });
  }),
  upsertDueRow: mock(async (row: DueRow) => {
    maintenanceStubs.upsertedDue.push(row);
  }),
};

export const maintenanceVehicleMocks = {
  findVehicleRowById: mock(async () => maintenanceStubs.vehicle),
};

export const maintenanceUserMocks = {
  findUserById: mock(async () => maintenanceStubs.owner),
};

export const maintenanceMailMocks = {
  isMailConfigured: mock(() => maintenanceStubs.mailConfigured),
  sendMail: mock(
    async (message: { to: string; subject: string; text: string }) => {
      if (maintenanceStubs.mailFailures > 0) {
        maintenanceStubs.mailFailures -= 1;
        throw new Error("smtp down");
      }
      maintenanceStubs.sentMail.push({
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    },
  ),
};
