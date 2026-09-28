import type {
  MechanicBookingDetail,
  MechanicBookingStatus,
  MechanicBookingSummary,
  MechanicIncomeEntry,
  MechanicIncomeSummary,
  MechanicMonthlyPoint,
  MechanicNavigationBoard,
  MechanicNavigationTarget,
  MechanicRatingBucket,
  MechanicReviewItem,
  MechanicSavedLocation,
  MechanicStats,
} from "@/lib/mechanic/mechanic.types";
import type { MechanicPresence } from "@/lib/mechanic/mechanic-profile.service";
import type { MechanicBookingAction } from "@/lib/mechanic/mechanic-status";
import type {
  BookingPayment,
  BookingPaymentMethod,
} from "@/lib/payments/booking-payment.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type {
  BookingPayment,
  BookingPaymentMethod,
  MechanicBookingAction,
  MechanicBookingDetail,
  MechanicPresence,
  MechanicBookingStatus,
  MechanicBookingSummary,
  MechanicIncomeEntry,
  MechanicIncomeSummary,
  MechanicMonthlyPoint,
  MechanicNavigationBoard,
  MechanicNavigationTarget,
  MechanicRatingBucket,
  MechanicReviewItem,
  MechanicSavedLocation,
  MechanicStats,
};
export { AuthApiError };

export type BookingListQuery = {
  status?: MechanicBookingStatus | "all";
  limit?: number;
};

function toBookingsQueryString(query: BookingListQuery): string {
  const params = new URLSearchParams();
  if (query.status && query.status !== "all")
    params.set("status", query.status);
  if (query.limit) params.set("limit", String(query.limit));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function fetchMechanicBookings(
  query: BookingListQuery = {},
): Promise<{ bookings: MechanicBookingSummary[] }> {
  return apiRequest<{ bookings: MechanicBookingSummary[] }>(
    `/api/mechanic/bookings${toBookingsQueryString(query)}`,
  );
}

export function fetchMechanicBooking(
  bookingId: string,
): Promise<{ booking: MechanicBookingDetail }> {
  return apiRequest<{ booking: MechanicBookingDetail }>(
    `/api/mechanic/bookings/${encodeURIComponent(bookingId)}`,
  );
}

export function bookingActionRequest(
  bookingId: string,
  action: MechanicBookingAction,
  note?: string,
): Promise<{ booking: MechanicBookingSummary }> {
  return apiRequest<{ booking: MechanicBookingSummary }>(
    `/api/mechanic/bookings/${encodeURIComponent(bookingId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(note ? { action, note } : { action }),
    },
  );
}

export function fetchMechanicIncome(limit?: number): Promise<{
  summary: MechanicIncomeSummary;
  entries: MechanicIncomeEntry[];
  truncated: boolean;
}> {
  const suffix = limit ? `?limit=${limit}` : "";
  return apiRequest<{
    summary: MechanicIncomeSummary;
    entries: MechanicIncomeEntry[];
    truncated: boolean;
  }>(`/api/mechanic/income${suffix}`);
}

export type RecordBookingPaymentInput = {
  method: BookingPaymentMethod;
  /** This installment's amount; omitted settles the remaining balance. */
  amount?: number;
  /** Idempotency key: retries of the same collection reuse it. */
  paymentId: string;
  /** Six-digit code the customer dictates for cash collections. */
  confirmCode?: string;
};

// Records collection of a finished job — full or partial: the mechanic
// confirms money reached them (cash on the spot or a bank transfer).
// Server-side the write is idempotent and publishes `payment-recorded`.
export function recordBookingPaymentRequest(
  bookingId: string,
  input: RecordBookingPaymentInput,
): Promise<{ payment: BookingPayment }> {
  return apiRequest<{ payment: BookingPayment }>(
    `/api/mechanic/bookings/${encodeURIComponent(bookingId)}/payment`,
    {
      method: "POST",
      body: JSON.stringify({
        method: input.method,
        amount: input.amount,
        paymentId: input.paymentId,
        confirmCode: input.confirmCode,
        confirmed: true,
      }),
    },
  );
}

// Rotates the customer-facing cash confirmation code. Returns only
// { issued: true } — the code itself is delivered to the customer.
export function issueBookingPaymentCodeRequest(
  bookingId: string,
): Promise<{ issued: boolean }> {
  return apiRequest<{ issued: boolean }>(
    `/api/mechanic/bookings/${encodeURIComponent(bookingId)}/payment-code`,
    { method: "POST" },
  );
}

export function fetchMechanicStats(): Promise<{
  stats: MechanicStats;
  monthly: MechanicMonthlyPoint[];
  ratings: MechanicRatingBucket[];
  reviews: MechanicReviewItem[];
}> {
  return apiRequest<{
    stats: MechanicStats;
    monthly: MechanicMonthlyPoint[];
    ratings: MechanicRatingBucket[];
    reviews: MechanicReviewItem[];
  }>("/api/mechanic/stats");
}

export function fetchNavigationBoard(): Promise<{
  board: MechanicNavigationBoard;
}> {
  return apiRequest<{ board: MechanicNavigationBoard }>(
    "/api/mechanic/navigation",
  );
}

export type UpdateLocationPayload = {
  latitude: number;
  longitude: number;
  currentJobId?: string;
  currentJobType?: "booking" | "emergency" | "order" | "none";
};

export function updateMechanicLocationRequest(
  payload: UpdateLocationPayload,
): Promise<{ location: MechanicSavedLocation }> {
  return apiRequest<{ location: MechanicSavedLocation }>(
    "/api/mechanic/navigation",
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export type UpdatePresencePayload = {
  online: boolean;
  skills: string[];
  baseLat: number | null;
  baseLng: number | null;
};

export function fetchMechanicPresence(): Promise<{
  profile: MechanicPresence;
}> {
  return apiRequest<{ profile: MechanicPresence }>("/api/mechanic/profile");
}

export function updateMechanicPresenceRequest(
  payload: UpdatePresencePayload,
): Promise<{ profile: MechanicPresence }> {
  return apiRequest<{ profile: MechanicPresence }>("/api/mechanic/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
