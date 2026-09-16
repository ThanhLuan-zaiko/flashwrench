// Geometry helpers for the navigation board. Pure math only: the UI builds
// map links from these values and never calls a routing API.

export type GeoPoint = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

// Average door-to-door speed for a motorbike in Vietnamese city traffic.
// Used only for a rough ETA hint; the map link stays the source of truth.
export const CITY_AVG_SPEED_KMH = 24;

export function isValidLatitude(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 90
  );
}

export function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= 180
  );
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two points, rounded to 0.1 km. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  return Math.round(distance * 10) / 10;
}

/** Rough travel time in minutes for a city motorbike trip (min 1 minute). */
export function estimateEtaMin(
  distanceKm: number,
  avgSpeedKmh = CITY_AVG_SPEED_KMH,
): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 1;
  const speed = avgSpeedKmh > 0 ? avgSpeedKmh : CITY_AVG_SPEED_KMH;
  return Math.max(1, Math.round((distanceKm / speed) * 60));
}

export type MapBoundingBox = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

/** Bounding box around a center, padded by kilometers on every side. */
export function boundingBoxAround(
  center: GeoPoint,
  paddingKm = 2,
): MapBoundingBox {
  const latDelta = paddingKm / 111;
  const lngScale = Math.max(0.2, Math.cos(toRadians(center.lat)));
  const lngDelta = paddingKm / (111 * lngScale);
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

/** Bounding box that covers every point with a small margin. */
export function boundingBoxOfPoints(
  points: GeoPoint[],
  paddingKm = 1,
): MapBoundingBox | null {
  if (points.length === 0) return null;
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const center: GeoPoint = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
  const spanKm = Math.max(
    haversineKm(center, { lat: Math.min(...lats), lng: center.lng }),
    haversineKm(center, { lat: center.lat, lng: Math.min(...lngs) }),
  );
  return boundingBoxAround(center, Math.max(paddingKm, spanKm + 0.5));
}
