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
import type { MechanicBookingAction } from "@/lib/mechanic/mechanic-status";
import { AuthApiError, apiRequest } from "./auth.api";

export type {
  MechanicBookingAction,
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
  currentJobType?: "booking" | "emergency" | "none";
};

export function updateMechanicLocationRequest(
  payload: UpdateLocationPayload,
): Promise<{ location: MechanicSavedLocation }> {
  return apiRequest<{ location: MechanicSavedLocation }>(
    "/api/mechanic/navigation",
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
