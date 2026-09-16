import type {
  BookingFieldErrors,
  CreateBookingInput,
  CreatedBooking,
} from "@/lib/booking/booking.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { BookingFieldErrors, CreatedBooking, CreateBookingInput };
export type { AuthApiError };

export class BookingApiError extends Error {
  status: number;
  errors: BookingFieldErrors;

  constructor(status: number, errors: BookingFieldErrors) {
    super(errors.form ?? "Đã có lỗi xảy ra.");
    this.name = "BookingApiError";
    this.status = status;
    this.errors = errors;
  }
}

// Customer booking creation. Authenticated HTTPS with the shared
// access-refresh retry, so an expired (but refreshable) session never
// bounces a logged-in customer back to the login page mid-booking.
export async function createBookingRequest(
  payload: CreateBookingInput,
): Promise<{ booking: CreatedBooking }> {
  try {
    return await apiRequest<{ booking: CreatedBooking }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw new BookingApiError(
        error.status,
        error.errors as BookingFieldErrors,
      );
    }
    throw error;
  }
}
