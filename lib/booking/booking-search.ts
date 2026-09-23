import { STATUS_LABELS } from "@/lib/mechanic/mechanic-status";
import type { BookingSummary } from "./workspace.types";

export const MAX_BOOKING_SEARCH_LENGTH = 80;
export type BookingSearchable = Pick<
  BookingSummary,
  | "id"
  | "customerName"
  | "vehiclePlate"
  | "mechanicName"
  | "addressText"
  | "serviceNames"
  | "status"
>;

export function normalizeBookingSearch(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase("vi");
}

export function matchesBookingSearch(
  booking: BookingSearchable,
  normalizedSearch: string,
): boolean {
  if (!normalizedSearch) return true;
  const searchable = [
    booking.id,
    booking.customerName,
    booking.vehiclePlate,
    booking.mechanicName,
    booking.addressText,
    booking.serviceNames.join(" "),
    STATUS_LABELS[booking.status],
  ];
  return searchable.some((value) =>
    normalizeBookingSearch(value).includes(normalizedSearch),
  );
}
