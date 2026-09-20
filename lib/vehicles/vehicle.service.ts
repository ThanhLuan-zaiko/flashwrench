import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import type {
  CursorPage,
  WorkspaceResult,
} from "@/lib/booking/workspace.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { toIso, toNumberOr } from "@/lib/mechanic/mechanic.types";
import { isUuid } from "@/lib/validation";
import {
  claimVehiclePlate,
  findVehicleRowById,
  insertVehicle,
  listMaintenanceRowsByVehicle,
  listVehicleIdsByOwner,
  releaseVehiclePlate,
  updateVehicle,
  type VehicleRow,
} from "./vehicle.repository";
import {
  type MaintenanceItem,
  VEHICLE_TYPES,
  type VehicleFieldErrors,
  type VehicleItem,
  type VehicleType,
} from "./vehicle.types";
import { canonicalPlate, validateVehicleInput } from "./vehicle.validation";

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;

function fail<T>(
  status: number,
  errors: VehicleFieldErrors,
): WorkspaceResult<T> {
  return { ok: false, status, errors: errors as Record<string, string> };
}

function resolveLimit(limit: unknown): number {
  if (limit === undefined || limit === null) return DEFAULT_PAGE_SIZE;
  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
    return -1;
  }
  return parsed;
}

function toVehicleItem(row: VehicleRow): VehicleItem {
  return {
    id: row.vehicle_id,
    licensePlate: row.license_plate ?? "",
    brand: row.brand ?? "",
    model: row.model ?? "",
    year: row.year,
    vehicleType: VEHICLE_TYPES.includes(row.vehicle_type as VehicleType)
      ? (row.vehicle_type as VehicleType)
      : "car",
    odometerKm: toNumberOr(row.odometer_km),
    archived: row.is_archived === true,
    createdAt: toIso(row.created_at) ?? "",
  };
}

function vehiclesScope(ownerId: string): string {
  return `vehicles:${ownerId}`;
}

function historyScope(ownerId: string, vehicleId: string): string {
  return `vehicle-history:${ownerId}:${vehicleId}`;
}

export async function listVehicles(
  ownerId: string,
  params: { cursor?: string | null; limit?: unknown },
): Promise<WorkspaceResult<CursorPage<VehicleItem>>> {
  const limit = resolveLimit(params.limit);
  if (limit === -1) return fail(400, { form: "Số lượng không hợp lệ." });
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor, vehiclesScope(ownerId));
  } catch {
    return fail(400, { cursor: "Con trỏ trang không hợp lệ." });
  }
  const page = await listVehicleIdsByOwner(ownerId, limit, pageState);
  const rows = await Promise.all(
    page.vehicleIds.map((id) => findVehicleRowById(id)),
  );
  const items = rows
    .filter(
      (row): row is VehicleRow => row !== null && row.owner_id === ownerId,
    )
    .map(toVehicleItem);
  return {
    ok: true,
    data: {
      items,
      nextCursor: encodeCursor(page.pageState, vehiclesScope(ownerId)),
    },
  };
}

export async function getVehicle(
  ownerId: string,
  vehicleId: string,
): Promise<WorkspaceResult<VehicleItem>> {
  if (!isUuid(vehicleId)) {
    return fail(400, { form: "Mã xe không hợp lệ." });
  }
  const row = await findVehicleRowById(vehicleId);
  if (!row || row.owner_id !== ownerId) {
    return fail(404, { form: "Không tìm thấy xe này." });
  }
  return { ok: true, data: toVehicleItem(row) };
}

export async function createVehicle(
  owner: PublicUser,
  raw: unknown,
): Promise<WorkspaceResult<VehicleItem>> {
  const checked = validateVehicleInput(raw);
  if ("errors" in checked) {
    return {
      ok: false,
      status: 400,
      errors: checked.errors as Record<string, string>,
    };
  }
  const value = checked.value;
  const vehicleId = randomUUID();
  const claimed = await claimVehiclePlate(
    value.licensePlate,
    vehicleId,
    owner.id,
  );
  if (!claimed) {
    return fail(409, { licensePlate: "Biển số xe này đã được đăng ký." });
  }
  const now = new Date();
  const params = {
    vehicleId,
    ownerId: owner.id,
    licensePlate: value.licensePlate,
    brand: value.brand,
    model: value.model,
    year: value.year,
    vehicleType: value.vehicleType,
    odometerKm: value.odometerKm,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await insertVehicle(params);
  } catch (error) {
    const persisted = await findVehicleRowById(vehicleId);
    if (!persisted) {
      await releaseVehiclePlate(value.licensePlate, vehicleId);
      throw error;
    }
  }
  const row = await findVehicleRowById(vehicleId);
  const fallback: VehicleRow = {
    vehicle_id: vehicleId,
    owner_id: owner.id,
    license_plate: value.licensePlate,
    brand: value.brand,
    model: value.model,
    year: value.year,
    vehicle_type: value.vehicleType,
    odometer_km: value.odometerKm,
    is_default: false,
    is_archived: false,
    created_at: now,
    updated_at: now,
  };
  return { ok: true, data: toVehicleItem(row ?? fallback) };
}

export async function updateVehicleDetails(
  ownerId: string,
  vehicleId: string,
  raw: unknown,
): Promise<WorkspaceResult<VehicleItem>> {
  if (!isUuid(vehicleId)) {
    return fail(400, { form: "Mã xe không hợp lệ." });
  }
  const checked = validateVehicleInput(raw);
  if ("errors" in checked) {
    return {
      ok: false,
      status: 400,
      errors: checked.errors as Record<string, string>,
    };
  }
  const row = await findVehicleRowById(vehicleId);
  if (!row || row.owner_id !== ownerId) {
    return fail(404, { form: "Không tìm thấy xe này." });
  }
  if (canonicalPlate(row.license_plate ?? "") !== checked.value.licensePlate) {
    return fail(400, {
      licensePlate: "Không thể đổi biển số xe đã đăng ký.",
    });
  }
  const now = new Date();
  await updateVehicle({
    vehicleId,
    ownerId,
    createdAt: row.created_at ?? now,
    brand: checked.value.brand,
    model: checked.value.model,
    year: checked.value.year,
    vehicleType: checked.value.vehicleType,
    odometerKm: checked.value.odometerKm,
    archived: row.is_archived === true,
    updatedAt: now,
  });
  const refreshed = await findVehicleRowById(vehicleId);
  return { ok: true, data: toVehicleItem(refreshed ?? row) };
}

export async function setVehicleArchived(
  ownerId: string,
  vehicleId: string,
  archived: boolean,
): Promise<WorkspaceResult<VehicleItem>> {
  if (!isUuid(vehicleId)) {
    return fail(400, { form: "Mã xe không hợp lệ." });
  }
  const row = await findVehicleRowById(vehicleId);
  if (!row || row.owner_id !== ownerId) {
    return fail(404, { form: "Không tìm thấy xe này." });
  }
  const now = new Date();
  await updateVehicle({
    vehicleId,
    ownerId,
    createdAt: row.created_at ?? now,
    brand: row.brand ?? "",
    model: row.model ?? "",
    year: row.year,
    vehicleType: row.vehicle_type ?? "car",
    odometerKm: row.odometer_km ?? 0,
    archived,
    updatedAt: now,
  });
  const refreshed = await findVehicleRowById(vehicleId);
  return { ok: true, data: toVehicleItem(refreshed ?? row) };
}

export async function listVehicleHistory(
  ownerId: string,
  vehicleId: string,
  params: { cursor?: string | null; limit?: unknown },
): Promise<WorkspaceResult<CursorPage<MaintenanceItem>>> {
  if (!isUuid(vehicleId)) {
    return fail(400, { form: "Mã xe không hợp lệ." });
  }
  const limit = resolveLimit(params.limit);
  if (limit === -1) return fail(400, { form: "Số lượng không hợp lệ." });
  const row = await findVehicleRowById(vehicleId);
  if (!row || row.owner_id !== ownerId) {
    return fail(404, { form: "Không tìm thấy xe này." });
  }
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor, historyScope(ownerId, vehicleId));
  } catch {
    return fail(400, { cursor: "Con trỏ trang không hợp lệ." });
  }
  const page = await listMaintenanceRowsByVehicle(vehicleId, limit, pageState);
  return {
    ok: true,
    data: {
      items: page.rows.map((entry) => ({
        id: entry.record_id,
        servicedAt: toIso(entry.serviced_at),
        sourceType: entry.source_type ?? "",
        sourceId: entry.source_id,
        mechanicName: entry.mechanic_name ?? "",
        summary: entry.summary ?? "",
        cost: toNumberOr(entry.cost),
        odometerKm: entry.odometer_km,
        nextDueAt: toIso(entry.next_due_at),
        nextDueKm: entry.next_due_km,
      })),
      nextCursor: encodeCursor(
        page.pageState,
        historyScope(ownerId, vehicleId),
      ),
    },
  };
}
