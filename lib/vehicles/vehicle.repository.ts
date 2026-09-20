import { scylla } from "@/lib/db/client";

export type VehicleRow = {
  vehicle_id: string;
  owner_id: string | null;
  license_plate: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  vehicle_type: string | null;
  odometer_km: number | null;
  is_default: boolean | null;
  is_archived: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type MaintenanceRow = {
  serviced_at: Date | null;
  record_id: string;
  source_type: string | null;
  source_id: string | null;
  mechanic_name: string | null;
  summary: string | null;
  cost: number | null;
  odometer_km: number | null;
  next_due_at: Date | null;
  next_due_km: number | null;
};

export type VehiclePageResult = {
  vehicleIds: string[];
  pageState: string | null;
};

export type MaintenancePageResult = {
  rows: MaintenanceRow[];
  pageState: string | null;
};

export type VehicleInsertParams = {
  vehicleId: string;
  ownerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  vehicleType: string;
  odometerKm: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MaintenanceInsertParams = {
  vehicleId: string;
  servicedAt: Date;
  recordId: string;
  sourceType: string;
  sourceId: string | null;
  mechanicName: string | null;
  summary: string;
  cost: number;
  odometerKm: number | null;
};

type RawRow = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toVehicleRow(raw: RawRow): VehicleRow {
  return {
    vehicle_id: String(raw.vehicle_id),
    owner_id: toStringOrNull(raw.owner_id),
    license_plate: toStringOrNull(raw.license_plate),
    brand: toStringOrNull(raw.brand),
    model: toStringOrNull(raw.model),
    year: toNumberOrNull(raw.year),
    vehicle_type: toStringOrNull(raw.vehicle_type),
    odometer_km: toNumberOrNull(raw.odometer_km),
    is_default: raw.is_default === true,
    is_archived: raw.is_archived === true,
    created_at: toDateOrNull(raw.created_at),
    updated_at: toDateOrNull(raw.updated_at),
  };
}

function toMaintenanceRow(raw: RawRow): MaintenanceRow {
  return {
    serviced_at: toDateOrNull(raw.serviced_at),
    record_id: String(raw.record_id),
    source_type: toStringOrNull(raw.source_type),
    source_id: toStringOrNull(raw.source_id),
    mechanic_name: toStringOrNull(raw.mechanic_name),
    summary: toStringOrNull(raw.summary),
    cost: toNumberOrNull(raw.cost),
    odometer_km: toNumberOrNull(raw.odometer_km),
    next_due_at: toDateOrNull(raw.next_due_at),
    next_due_km: toNumberOrNull(raw.next_due_km),
  };
}

export async function findVehicleRowById(
  vehicleId: string,
): Promise<VehicleRow | null> {
  const result = await scylla.execute(
    "SELECT vehicle_id, owner_id, license_plate, brand, model, year, vehicle_type, odometer_km, is_default, is_archived, created_at, updated_at FROM vehicles_by_id WHERE vehicle_id = ?",
    [vehicleId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toVehicleRow(row) : null;
}

export async function listVehicleIdsByOwner(
  ownerId: string,
  limit: number,
  pageState?: string | null,
): Promise<VehiclePageResult> {
  const result = await scylla.execute(
    "SELECT vehicle_id FROM vehicles_by_owner WHERE owner_id = ?",
    [ownerId],
    {
      prepare: true,
      fetchSize: limit,
      pageState: pageState ?? undefined,
    },
  );
  const rows = result.rows as unknown as RawRow[];
  return {
    vehicleIds: rows.map((row) => String(row.vehicle_id)),
    pageState: result.pageState ?? null,
  };
}

export async function claimVehiclePlate(
  licensePlate: string,
  vehicleId: string,
  ownerId: string,
): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO vehicles_by_plate (license_plate, vehicle_id, owner_id) VALUES (?, ?, ?) IF NOT EXISTS",
    [licensePlate, vehicleId, ownerId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

export async function releaseVehiclePlate(
  licensePlate: string,
  vehicleId: string,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM vehicles_by_plate WHERE license_plate = ? IF vehicle_id = ?",
    [licensePlate, vehicleId],
    { prepare: true },
  );
}

export async function insertVehicle(
  params: VehicleInsertParams,
): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO vehicles_by_id (vehicle_id, owner_id, license_plate, brand, model, year, vehicle_type, odometer_km, is_default, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          params.vehicleId,
          params.ownerId,
          params.licensePlate,
          params.brand,
          params.model,
          params.year,
          params.vehicleType,
          params.odometerKm,
          false,
          params.archived,
          params.createdAt,
          params.updatedAt,
        ],
      },
      {
        query:
          "INSERT INTO vehicles_by_owner (owner_id, created_at, vehicle_id, license_plate, brand, model, year, vehicle_type, is_default, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          params.ownerId,
          params.createdAt,
          params.vehicleId,
          params.licensePlate,
          params.brand,
          params.model,
          params.year,
          params.vehicleType,
          false,
          params.archived,
        ],
      },
    ],
    { prepare: true },
  );
}

export async function updateVehicle(params: {
  vehicleId: string;
  ownerId: string;
  createdAt: Date;
  brand: string;
  model: string;
  year: number | null;
  vehicleType: string;
  odometerKm: number;
  archived: boolean;
  updatedAt: Date;
}): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "UPDATE vehicles_by_id SET brand = ?, model = ?, year = ?, vehicle_type = ?, odometer_km = ?, is_archived = ?, updated_at = ? WHERE vehicle_id = ?",
        params: [
          params.brand,
          params.model,
          params.year,
          params.vehicleType,
          params.odometerKm,
          params.archived,
          params.updatedAt,
          params.vehicleId,
        ],
      },
      {
        query:
          "UPDATE vehicles_by_owner SET brand = ?, model = ?, year = ?, vehicle_type = ?, is_archived = ? WHERE owner_id = ? AND created_at = ? AND vehicle_id = ?",
        params: [
          params.brand,
          params.model,
          params.year,
          params.vehicleType,
          params.archived,
          params.ownerId,
          params.createdAt,
          params.vehicleId,
        ],
      },
    ],
    { prepare: true },
  );
}

export async function listMaintenanceRowsByVehicle(
  vehicleId: string,
  limit: number,
  pageState?: string | null,
): Promise<MaintenancePageResult> {
  const result = await scylla.execute(
    "SELECT serviced_at, record_id, source_type, source_id, mechanic_name, summary, cost, odometer_km, next_due_at, next_due_km FROM maintenance_history_by_vehicle WHERE vehicle_id = ?",
    [vehicleId],
    {
      prepare: true,
      fetchSize: limit,
      pageState: pageState ?? undefined,
    },
  );
  const rows = result.rows as unknown as RawRow[];
  return {
    rows: rows.map(toMaintenanceRow),
    pageState: result.pageState ?? null,
  };
}

export async function insertMaintenanceRecord(
  params: MaintenanceInsertParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO maintenance_history_by_vehicle (vehicle_id, serviced_at, record_id, source_type, source_id, mechanic_name, summary, cost, odometer_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      params.vehicleId,
      params.servicedAt,
      params.recordId,
      params.sourceType,
      params.sourceId,
      params.mechanicName,
      params.summary,
      params.cost,
      params.odometerKm,
    ],
    { prepare: true },
  );
}
