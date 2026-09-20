import type {
  BookingDetail,
  BookingSummary,
} from "@/lib/booking/workspace.types";
import type { DispatchAction } from "@/lib/dispatch/dispatch.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { BookingDetail, BookingSummary, DispatchAction };
export { AuthApiError };

export type DispatchListQuery = {
  status: string;
  month?: string;
  cursor?: string | null;
  limit?: number;
};

export type DispatchActionPayload = {
  action: DispatchAction;
  mechanicId?: string;
  note?: string;
  expectedUpdatedAt: string | null;
};

function toBookingsQueryString(query: DispatchListQuery): string {
  const params = new URLSearchParams();
  params.set("status", query.status);
  if (query.month) params.set("month", query.month);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit) params.set("limit", String(query.limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

// Dispatcher queue page: one status partition of one month bucket.
// `cursor` is the opaque pageState returned as `nextCursor`.
export function fetchDispatchBookings(
  query: DispatchListQuery,
): Promise<{ items: BookingSummary[]; nextCursor: string | null }> {
  return apiRequest<{ items: BookingSummary[]; nextCursor: string | null }>(
    `/api/dispatch/bookings${toBookingsQueryString(query)}`,
  );
}

export function fetchDispatchBooking(
  bookingId: string,
): Promise<{ booking: BookingDetail }> {
  return apiRequest<{ booking: BookingDetail }>(
    `/api/dispatch/bookings/${encodeURIComponent(bookingId)}`,
  );
}

// assign/confirm/cancel go through one endpoint. `expectedUpdatedAt` is the
// optimistic-concurrency token: the server 409s when the row moved on.
export function dispatchBookingAction(
  bookingId: string,
  payload: DispatchActionPayload,
): Promise<{ booking: BookingSummary }> {
  return apiRequest<{ booking: BookingSummary }>(
    `/api/dispatch/bookings/${encodeURIComponent(bookingId)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
