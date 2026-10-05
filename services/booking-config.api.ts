import type {
  BookingConfig,
  BookingPolicy,
} from "@/lib/booking/booking-config.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { BookingConfig, BookingPolicy };
export { AuthApiError };

// Booking config endpoints return a minLeadDays field error, not auth
// fields, so callers narrow on this shape instead of AuthApiError.
export class BookingConfigApiError extends Error {
  status: number;
  errors: Record<string, string>;

  constructor(status: number, errors: Record<string, string>) {
    super(errors.form ?? "Đã có lỗi xảy ra.");
    this.name = "BookingConfigApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function bookingConfigRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  try {
    return await apiRequest<T>(path, init);
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw new BookingConfigApiError(
        error.status,
        error.errors as Record<string, string>,
      );
    }
    throw error;
  }
}

// Public read for the /booking form — no session needed, guests see the
// same intake window admins tuned.
export function fetchPublicBookingConfig(): Promise<BookingPolicy> {
  return bookingConfigRequest<BookingPolicy>("/api/booking-config");
}

export function fetchAdminBookingConfig(): Promise<{ config: BookingConfig }> {
  return bookingConfigRequest<{ config: BookingConfig }>(
    "/api/admin/booking-config",
  );
}

export type BookingConfigPayload = {
  minLeadDays: number;
  maxAdvanceDays: number;
  cancelCutoffHours: number;
  guestBookingEnabled: boolean;
};

export function updateAdminBookingConfig(
  payload: BookingConfigPayload,
): Promise<{ config: BookingConfig }> {
  return bookingConfigRequest<{ config: BookingConfig }>(
    "/api/admin/booking-config",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
