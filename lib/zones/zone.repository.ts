// Raw CQL for service zones. No business logic here: the service picks
// the containing zone for a rescue point.
import { scylla } from "@/lib/db/client";

export type ServiceZoneRow = {
  zone_id: string;
  name: string | null;
  city: string | null;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  is_active: boolean | null;
};

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function listServiceZones(): Promise<ServiceZoneRow[]> {
  const result = await scylla.execute(
    "SELECT zone_id, name, city, center_lat, center_lng, radius_km, is_active FROM service_zones",
    [],
    { prepare: true },
  );
  return result.rows.map(toServiceZoneRow);
}

function toServiceZoneRow(raw: unknown): ServiceZoneRow {
  const row = raw as Record<string, unknown>;
  return {
    zone_id: String(row.zone_id),
    name: toStringOrNull(row.name),
    city: toStringOrNull(row.city),
    center_lat: toNumberOrNull(row.center_lat),
    center_lng: toNumberOrNull(row.center_lng),
    radius_km: toNumberOrNull(row.radius_km),
    is_active: typeof row.is_active === "boolean" ? row.is_active : null,
  };
}

export async function findServiceZoneById(
  zoneId: string,
): Promise<ServiceZoneRow | null> {
  const result = await scylla.execute(
    "SELECT zone_id, name, city, center_lat, center_lng, radius_km, is_active FROM service_zones WHERE zone_id = ?",
    [zoneId],
    { prepare: true },
  );
  const raw = result.first() as unknown as Record<string, unknown> | null;
  if (!raw) return null;
  return toServiceZoneRow(raw);
}

export type UpsertServiceZoneParams = {
  zoneId: string;
  name: string;
  city: string | null;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isActive: boolean;
};

export async function insertServiceZone(
  params: UpsertServiceZoneParams,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO service_zones (zone_id, name, city, center_lat, center_lng, radius_km, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      params.zoneId,
      params.name,
      params.city,
      params.centerLat,
      params.centerLng,
      params.radiusKm,
      params.isActive,
      new Date(),
    ],
    { prepare: true },
  );
}

export async function updateServiceZone(
  params: Omit<UpsertServiceZoneParams, "zoneId"> & { zoneId: string },
): Promise<void> {
  await scylla.execute(
    "INSERT INTO service_zones (zone_id, name, city, center_lat, center_lng, radius_km, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      params.zoneId,
      params.name,
      params.city,
      params.centerLat,
      params.centerLng,
      params.radiusKm,
      params.isActive,
    ],
    { prepare: true },
  );
}
