import type {
  BookingFieldErrors,
  CreateBookingInput,
  CreatedBooking,
} from "@/lib/booking/booking.types";
import type {
  BookingDetail,
  BookingSummary,
  CursorPage,
} from "@/lib/booking/workspace.types";
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

// The customer's most recent booking, read off their own history list —
// powers the quick-rebook prefill so a returning customer can confirm in
// one tap when nothing changed.
export async function fetchLastBooking(): Promise<BookingSummary | null> {
  const page = await apiRequest<{
    items: BookingSummary[];
    nextCursor: string | null;
  }>("/api/bookings?limit=1");
  return page.items[0] ?? null;
}

const HISTORY_PAGE_SIZE = 10;

// Customer booking history page, cursor-paged by the server.
export async function fetchMyBookings(
  cursor: string | null,
): Promise<CursorPage<BookingSummary>> {
  const params = new URLSearchParams({ limit: String(HISTORY_PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  return apiRequest<CursorPage<BookingSummary>>(`/api/bookings?${params}`);
}

// One owned booking: line items, timeline, payment state and the live
// mechanic pin when the job is en route or in progress.
export async function fetchMyBooking(
  bookingId: string,
): Promise<BookingDetail | null> {
  const data = await apiRequest<{ booking: BookingDetail }>(
    `/api/bookings/${bookingId}`,
  );
  return data.booking ?? null;
}
