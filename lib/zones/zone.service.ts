// Zone resolution for rescue dispatch: a pinned point belongs to the
// nearest active zone containing it. Outside every radius the rescue
// stays zoneless and broadcasts to all online mechanics. The admin CRUD
// below owns zone data; only admins may change it.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import {
  haversineKm,
  isValidLatitude,
  isValidLongitude,
} from "@/lib/mechanic/mechanic-geo";
import {
  findServiceZoneById,
  insertServiceZone,
  listServiceZones,
  type ServiceZoneRow,
  updateServiceZone,
} from "./zone.repository";

export type ZonePoint = { lat: number; lng: number };

export function selectZoneForPoint(
  zones: ServiceZoneRow[],
  point: ZonePoint,
): ServiceZoneRow | null {
  let best: ServiceZoneRow | null = null;
  let bestDistance = Infinity;
  for (const zone of zones) {
    if (zone.is_active !== true) continue;
    if (zone.center_lat === null || zone.center_lng === null) continue;
    if (zone.radius_km === null || zone.radius_km <= 0) continue;
    const distance = haversineKm(point, {
      lat: zone.center_lat,
      lng: zone.center_lng,
    });
    if (distance <= zone.radius_km && distance < bestDistance) {
      best = zone;
      bestDistance = distance;
    }
  }
  return best;
}

export async function resolveZoneForPoint(
  point: ZonePoint,
): Promise<string | null> {
  const zones = await listServiceZones();
  return selectZoneForPoint(zones, point)?.zone_id ?? null;
}

export const ZONE_NAME_MAX = 120;
export const ZONE_CITY_MAX = 120;
export const ZONE_RADIUS_MIN_KM = 0.5;
export const ZONE_RADIUS_MAX_KM = 100;

export type ZoneInput = {
  name: string;
  city?: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isActive?: boolean;
};

export type ZoneFieldErrors = Partial<
  Record<"name" | "city" | "center" | "radiusKm" | "form", string>
>;

export type ZoneResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: ZoneFieldErrors };

export type ZoneItem = {
  zoneId: string;
  name: string;
  city: string | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  isActive: boolean;
};

function toItem(row: ServiceZoneRow): ZoneItem {
  return {
    zoneId: row.zone_id,
    name: row.name ?? "",
    city: row.city,
    centerLat: row.center_lat,
    centerLng: row.center_lng,
    radiusKm: row.radius_km,
    isActive: row.is_active === true,
  };
}

function fail<T>(status: number, form: string): ZoneResult<T> {
  return { ok: false, status, errors: { form } };
}

function requireAdmin(actor: PublicUser): ZoneResult<never> | null {
  if (actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  return null;
}

function validateZoneInput(raw: unknown):
  | {
      value: {
        name: string;
        city: string | null;
        centerLat: number;
        centerLng: number;
        radiusKm: number;
        isActive: boolean;
      };
    }
  | { errors: ZoneFieldErrors } {
  const errors: ZoneFieldErrors = {};
  const body =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const name =
    typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  if (!name) {
    errors.name = "Vui lòng nhập tên khu vực.";
  } else if (name.length > ZONE_NAME_MAX) {
    errors.name = "Tên khu vực tối đa 120 ký tự.";
  }

  const cityRaw = body.city;
  let city: string | null = null;
  if (
    cityRaw !== undefined &&
    cityRaw !== null &&
    String(cityRaw).trim() !== ""
  ) {
    if (typeof cityRaw !== "string") {
      errors.city = "Thành phố tối đa 120 ký tự.";
    } else {
      city = cityRaw.trim().replace(/\s+/g, " ");
      if (city.length > ZONE_CITY_MAX) {
        errors.city = "Thành phố tối đa 120 ký tự.";
        city = null;
      }
    }
  }

  const centerLat = typeof body.centerLat === "number" ? body.centerLat : NaN;
  const centerLng = typeof body.centerLng === "number" ? body.centerLng : NaN;
  if (!isValidLatitude(centerLat) || !isValidLongitude(centerLng)) {
    errors.center = "Tâm khu vực không hợp lệ (vĩ độ ±90, kinh độ ±180).";
  }

  const radiusKm = typeof body.radiusKm === "number" ? body.radiusKm : NaN;
  if (
    !Number.isFinite(radiusKm) ||
    radiusKm < ZONE_RADIUS_MIN_KM ||
    radiusKm > ZONE_RADIUS_MAX_KM
  ) {
    errors.radiusKm = "Bán kính từ 0,5 đến 100 km.";
  }

  const isActive = body.isActive === undefined ? true : body.isActive === true;

  if (Object.keys(errors).length > 0) return { errors };
  return {
    value: { name, city, centerLat, centerLng, radiusKm, isActive },
  };
}

export async function listZones(
  actor: PublicUser,
): Promise<ZoneResult<{ items: ZoneItem[] }>> {
  const blocked = requireAdmin(actor);
  if (blocked) return blocked;
  const rows = await listServiceZones();
  return { ok: true, data: { items: rows.map(toItem) } };
}

export async function createZone(
  actor: PublicUser,
  raw: unknown,
): Promise<ZoneResult<{ item: ZoneItem }>> {
  const blocked = requireAdmin(actor);
  if (blocked) return blocked;
  const checked = validateZoneInput(raw);
  if ("errors" in checked) {
    return { ok: false, status: 400, errors: checked.errors };
  }
  const zoneId = randomUUID();
  await insertServiceZone({
    zoneId,
    name: checked.value.name,
    city: checked.value.city,
    centerLat: checked.value.centerLat,
    centerLng: checked.value.centerLng,
    radiusKm: checked.value.radiusKm,
    isActive: checked.value.isActive,
  });
  return {
    ok: true,
    data: {
      item: {
        zoneId,
        name: checked.value.name,
        city: checked.value.city,
        centerLat: checked.value.centerLat,
        centerLng: checked.value.centerLng,
        radiusKm: checked.value.radiusKm,
        isActive: checked.value.isActive,
      },
    },
  };
}

export async function updateZone(
  actor: PublicUser,
  zoneId: string,
  raw: unknown,
): Promise<ZoneResult<{ item: ZoneItem }>> {
  const blocked = requireAdmin(actor);
  if (blocked) return blocked;
  const existing = await findServiceZoneById(zoneId);
  if (!existing) return fail(404, "Không tìm thấy khu vực này.");
  const checked = validateZoneInput(raw);
  if ("errors" in checked) {
    return { ok: false, status: 400, errors: checked.errors };
  }
  await updateServiceZone({
    zoneId,
    name: checked.value.name,
    city: checked.value.city,
    centerLat: checked.value.centerLat,
    centerLng: checked.value.centerLng,
    radiusKm: checked.value.radiusKm,
    isActive: checked.value.isActive,
  });
  return {
    ok: true,
    data: {
      item: {
        zoneId,
        name: checked.value.name,
        city: checked.value.city,
        centerLat: checked.value.centerLat,
        centerLng: checked.value.centerLng,
        radiusKm: checked.value.radiusKm,
        isActive: checked.value.isActive,
      },
    },
  };
}
