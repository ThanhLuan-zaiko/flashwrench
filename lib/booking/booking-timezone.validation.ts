import { normalizeTimeZone } from "@/lib/datetime/timezone";
import type { BookingFieldErrors } from "./booking.types";

// The zone where the work happens. Optional on the wire; the service
// falls back to the product default. Garbage zones fail loudly so a
// typo can never silently reschedule a booking.
export function normalizeBookingTimeZone(
  raw: unknown,
  errors: BookingFieldErrors,
): string | null {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return null;
  }
  const normalized = normalizeTimeZone(raw);
  if (!normalized) {
    errors.timeZone =
      "Múi giờ không hợp lệ. Vui lòng đặt lại từ trang đặt lịch.";
    return null;
  }
  return normalized;
}
