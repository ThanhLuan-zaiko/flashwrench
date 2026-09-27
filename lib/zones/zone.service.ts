// Zone resolution for rescue dispatch: a pinned point belongs to the
// nearest active zone containing it. Outside every radius the rescue
// stays zoneless and broadcasts to all online mechanics.
import { haversineKm } from "@/lib/mechanic/mechanic-geo";
import { listServiceZones, type ServiceZoneRow } from "./zone.repository";

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
