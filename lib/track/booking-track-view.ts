import { generateTrackingCode } from "@/lib/orders/tracking-code";

// View helpers for the public booking tracker: the six booking statuses
// collapse into the four customer-facing stages of the tracking screen,
// plus distance / rough ETA from the mechanic's live pin.

export const BOOKING_TRACK_STAGES = [
  "Đã nhận yêu cầu",
  "Thợ đang đến",
  "Đang sửa chữa",
  "Hoàn tất và thanh toán",
] as const;

const STAGE_BY_STATUS: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  mechanic_assigned: 1,
  en_route: 1,
  in_progress: 2,
  completed: 3,
};

// Unknown statuses fall back to the first stage rather than guessing.
export function bookingTrackStage(status: string): number {
  return STAGE_BY_STATUS[status] ?? 0;
}

export type GeoPoint = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

// Great-circle distance in km, rounded to one decimal.
export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  return Math.round(km * 10) / 10;
}

// Average city riding speed used for the rough arrival estimate.
export const CITY_SPEED_KMH = 20;

// Rough minutes to arrival from straight-line distance; never below 1.
export function estimateEtaMinutes(km: number, speedKmh = CITY_SPEED_KMH) {
  if (!Number.isFinite(km) || km <= 0) return 1;
  return Math.max(1, Math.ceil((km / speedKmh) * 60));
}

// "3,2 km" with the Vietnamese decimal comma.
export function formatKm(km: number): string {
  return `${km.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} km`;
}

// Same FW-XXXXXXXX shape the shop already uses for order tracking codes.
export function bookingTicketCode(bookingId: string): string {
  return generateTrackingCode(bookingId);
}
