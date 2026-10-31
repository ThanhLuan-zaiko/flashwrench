// Raw CQL for maintenance cadence, the due-month index, the reminder ledger
// and the per-customer opt-out. No business logic here — see the services.
import { scylla } from "@/lib/db/client";
import type { ServiceCadence } from "./maintenance-schedule";

export type DueRow = {
  dueMonth: string;
  dueAt: Date;
  vehicleId: string;
  ownerId: string | null;
  nextDueKm: number | null;
  reminderGroup: string;
};

// The newest completed visit of a vehicle and the due values it set.
export type LatestVisit = {
  recordId: string;
  servedAt: Date;
  sourceType: string | null;
  sourceId: string | null;
  odometerKm: number | null;
  nextDueAt: Date | null;
  nextDueKm: number | null;
};

type RawDueRow = {
  due_month: string;
  due_at: Date;
  vehicle_id: unknown;
  owner_id: unknown;
  next_due_km: number | null;
  reminder_group: string | null;
};

function toDueRow(raw: RawDueRow): DueRow {
  return {
    dueMonth: raw.due_month,
    dueAt: raw.due_at,
    vehicleId: String(raw.vehicle_id),
    ownerId: raw.owner_id === null ? null : String(raw.owner_id),
    nextDueKm: raw.next_due_km,
    reminderGroup: raw.reminder_group ?? "treatment",
  };
}

// One partition read per service; a visit has only a handful of services.
export async function findServiceCadences(
  serviceIds: string[],
): Promise<ServiceCadence[]> {
  const results = await Promise.all(
    serviceIds.map((serviceId) =>
      scylla.execute(
        "SELECT interval_months, interval_km FROM maintenance_intervals_by_service WHERE service_id = ?",
        [serviceId],
        { prepare: true },
      ),
    ),
  );
  return results.flatMap((result) =>
    result.rows.map((raw) => {
      const row = raw as unknown as {
        interval_months: number | null;
        interval_km: number | null;
      };
      return {
        intervalMonths: row.interval_months,
        intervalKm: row.interval_km,
      };
    }),
  );
}

// The newest visit is the first row of the clustering order.
export async function findLatestVisit(
  vehicleId: string,
): Promise<LatestVisit | null> {
  const result = await scylla.execute(
    "SELECT record_id, serviced_at, source_type, source_id, odometer_km, next_due_at, next_due_km FROM maintenance_history_by_vehicle WHERE vehicle_id = ? LIMIT 1",
    [vehicleId],
    { prepare: true },
  );
  const raw = result.rows[0] as unknown as
    | {
        record_id: unknown;
        serviced_at: Date;
        source_type: string | null;
        source_id: unknown;
        odometer_km: number | null;
        next_due_at: Date | null;
        next_due_km: number | null;
      }
    | undefined;
  if (!raw) return null;
  return {
    recordId: String(raw.record_id),
    servedAt: raw.serviced_at,
    sourceType: raw.source_type,
    sourceId: raw.source_id === null ? null : String(raw.source_id),
    odometerKm: raw.odometer_km,
    nextDueAt: raw.next_due_at,
    nextDueKm: raw.next_due_km,
  };
}

// Backfill writes the due values onto a visit that was recorded before the
// feature existed.
export async function setVisitNextDue(params: {
  vehicleId: string;
  servedAt: Date;
  recordId: string;
  nextDueAt: Date | null;
  nextDueKm: number | null;
}): Promise<void> {
  await scylla.execute(
    "UPDATE maintenance_history_by_vehicle SET next_due_at = ?, next_due_km = ? WHERE vehicle_id = ? AND serviced_at = ? AND record_id = ?",
    [
      params.nextDueAt,
      params.nextDueKm,
      params.vehicleId,
      params.servedAt,
      params.recordId,
    ],
    { prepare: true },
  );
}

export async function upsertDueRow(row: DueRow): Promise<void> {
  await scylla.execute(
    "INSERT INTO maintenance_due_by_month (due_month, due_at, vehicle_id, owner_id, next_due_km, reminder_group) VALUES (?, ?, ?, ?, ?, ?)",
    [
      row.dueMonth,
      row.dueAt,
      row.vehicleId,
      row.ownerId,
      row.nextDueKm,
      row.reminderGroup,
    ],
    { prepare: true },
  );
}

export async function deleteDueRow(
  dueMonth: string,
  dueAt: Date,
  vehicleId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM maintenance_due_by_month WHERE due_month = ? AND due_at = ? AND vehicle_id = ?",
    [dueMonth, dueAt, vehicleId],
    { prepare: true },
  );
}

export async function listDueRows(
  dueMonth: string,
  from: Date,
  to: Date,
): Promise<DueRow[]> {
  const result = await scylla.execute(
    "SELECT due_month, due_at, vehicle_id, owner_id, next_due_km, reminder_group FROM maintenance_due_by_month WHERE due_month = ? AND due_at >= ? AND due_at <= ?",
    [dueMonth, from, to],
    { prepare: true },
  );
  return result.rows.map((raw) => toDueRow(raw as unknown as RawDueRow));
}

// IF NOT EXISTS is the serialization point: only one run can claim a
// (vehicle, reminder key) pair, so reruns and replicas never mail twice.
// The key is the due date for time-based reminders and the visit date for
// odometer-based ones.
export async function claimReminder(params: {
  vehicleId: string;
  reminderKey: Date;
  reminderGroup: string;
  claimedAt: Date;
}): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO maintenance_reminders_by_vehicle (vehicle_id, due_at, reminder_group, claimed_at) VALUES (?, ?, ?, ?) IF NOT EXISTS",
    [
      params.vehicleId,
      params.reminderKey,
      params.reminderGroup,
      params.claimedAt,
    ],
    { prepare: true },
  );
  return result.wasApplied();
}

// Undo a claim when the mail send fails, so the next attempt can retry.
export async function releaseReminderClaim(
  vehicleId: string,
  reminderKey: Date,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM maintenance_reminders_by_vehicle WHERE vehicle_id = ? AND due_at = ?",
    [vehicleId, reminderKey],
    { prepare: true },
  );
}

export async function findReminderOptOut(userId: string): Promise<boolean> {
  const result = await scylla.execute(
    "SELECT maintenance_opt_out FROM users_by_id WHERE user_id = ?",
    [userId],
    { prepare: true },
  );
  const row = result.rows[0] as unknown as
    | { maintenance_opt_out: boolean | null }
    | undefined;
  return row?.maintenance_opt_out === true;
}

export async function setReminderOptOut(
  userId: string,
  optOut: boolean,
): Promise<void> {
  await scylla.execute(
    "UPDATE users_by_id SET maintenance_opt_out = ?, updated_at = ? WHERE user_id = ?",
    [optOut, new Date(), userId],
    { prepare: true },
  );
}

export async function findBookingServiceIds(
  bookingId: string,
): Promise<string[]> {
  const result = await scylla.execute(
    "SELECT service_id FROM booking_items WHERE booking_id = ?",
    [bookingId],
    { prepare: true },
  );
  return result.rows.map((raw) =>
    String((raw as unknown as { service_id: unknown }).service_id),
  );
}

// One page of vehicle ids for the one-off backfill. Paging is driven by the
// driver's page state, so the caller loops until it comes back empty.
export async function listVehiclePage(pageState: string | null): Promise<{
  vehicles: {
    vehicleId: string;
    ownerId: string | null;
    isArchived: boolean;
  }[];
  nextPageState: string | null;
}> {
  const result = await scylla.execute(
    "SELECT vehicle_id, owner_id, is_archived FROM vehicles_by_id",
    [],
    { prepare: true, fetchSize: 200, ...(pageState ? { pageState } : {}) },
  );
  const vehicles = result.rows.map((raw) => {
    const row = raw as unknown as {
      vehicle_id: unknown;
      owner_id: unknown;
      is_archived: boolean | null;
    };
    return {
      vehicleId: String(row.vehicle_id),
      ownerId: row.owner_id === null ? null : String(row.owner_id),
      isArchived: row.is_archived === true,
    };
  });
  return { vehicles, nextPageState: result.pageState ?? null };
}
