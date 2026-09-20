// Shared UI formatting for the dispatch board. Re-exports the mechanic
// workspace formatters (currency, zoned datetimes, status pills) so the
// dispatcher reads the same vocabulary, plus dispatch-specific labels.
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";

export {
  formatScheduleDateTime,
  formatShortDate,
  formatVnd,
  paymentStateLabel,
  statusTone,
} from "../../../mechanic/components/mechanic-format";
export { DISPATCH_STATUS_LABELS } from "./dispatch-tabs";

export const DISPATCH_PAGE_SIZE = 8;

export function mechanicLabel(mechanicName: string | null | undefined): string {
  const name = mechanicName?.trim();
  return name ? name : "Chưa phân công";
}

// The API buckets bookings_by_status by the product home zone, so the
// picker must default to the same zone regardless of browser locale.
export function monthKeyNow(now: Date = new Date()): string {
  return monthKey(now, MECHANIC_TIME_ZONE);
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_PATTERN.test(value);
}

/** "Tháng 9/2026" for a "2026-09" month key. */
export function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  if (!year || !month) return key;
  return `Tháng ${Number(month)}/${year}`;
}

export function openStreetMapUrl(
  lat: number | null,
  lng: number | null,
): string | null {
  if (lat === null || lng === null) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export function statusSortHint(_status: MechanicBookingStatus): string {
  return "Đơn mới hẹn gần nhất hiện trước";
}
