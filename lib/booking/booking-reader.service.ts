import type {
  MechanicBookingItem,
  MechanicBookingRow,
  MechanicWorkloadRow,
} from "@/lib/mechanic/mechanic.types";
import { toIso } from "@/lib/mechanic/mechanic.types";
import {
  listBookingItemRowsByBookingIds,
  listStatusHistoryRows,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { isValidLatitude, isValidLongitude } from "@/lib/mechanic/mechanic-geo";
import {
  groupItemsByBooking,
  toBookingStatus,
  toBookingSummary,
  toTimelineEntry,
} from "@/lib/mechanic/mechanic-mapper";
import { findMechanicLocationRow } from "@/lib/mechanic/mechanic-workspace.repository";
import type { BookingReviewRow } from "./review.repository";
import { findReviewRowByBookingId } from "./review.repository";
import type {
  BookingDetail,
  BookingReview,
  BookingSummary,
} from "./workspace.types";

const DETAIL_HISTORY_LIMIT = 100;
const LIVE_LOCATION_MAX_AGE_MS = 5 * 60 * 1000;

function workloadFromCanonical(row: MechanicBookingRow): MechanicWorkloadRow {
  return {
    mechanic_id: row.mechanic_id ?? "",
    scheduled_at: row.scheduled_at,
    booking_id: row.booking_id,
    status: row.status,
    total: row.total,
    vehicle_plate: row.vehicle_plate,
    customer_name: row.customer_name,
  };
}

export function toWorkspaceSummary(
  row: MechanicBookingRow,
  items: MechanicBookingItem[],
): BookingSummary | null {
  const status = toBookingStatus(row.status);
  if (!status) return null;
  const summary = toBookingSummary({
    workload: workloadFromCanonical(row),
    detail: row,
    items,
    status,
  });
  return {
    ...summary,
    customerId: row.customer_id ?? "",
    mechanicId: row.mechanic_id,
    mechanicName: row.mechanic_name ?? "",
    vehicleId: row.vehicle_id,
  };
}

export async function mapBookingSummaries(
  rows: MechanicBookingRow[],
): Promise<BookingSummary[]> {
  const itemGroups = groupItemsByBooking(
    await listBookingItemRowsByBookingIds(rows.map((row) => row.booking_id)),
  );
  const summaries: BookingSummary[] = [];
  for (const row of rows) {
    const summary = toWorkspaceSummary(
      row,
      itemGroups.get(row.booking_id) ?? [],
    );
    if (summary) summaries.push(summary);
  }
  return summaries;
}

function toBookingReview(row: BookingReviewRow): BookingReview {
  return {
    id: row.review_id,
    bookingId: row.booking_id,
    mechanicId: row.mechanic_id ?? "",
    rating: row.rating ?? 0,
    body: row.body ?? "",
    createdAt: toIso(row.created_at) ?? "",
  };
}

async function liveLocationFor(
  row: MechanicBookingRow,
  status: string,
): Promise<BookingDetail["location"]> {
  if (status !== "en_route" && status !== "in_progress") return null;
  if (!row.mechanic_id) return null;
  const location = await findMechanicLocationRow(row.mechanic_id);
  if (!location) return null;
  if (
    location.current_job_id !== row.booking_id ||
    location.current_job_type !== "booking"
  ) {
    return null;
  }
  const updatedAt = location.updated_at?.getTime() ?? Number.NaN;
  const age = Date.now() - updatedAt;
  if (!Number.isFinite(age) || age < 0 || age > LIVE_LOCATION_MAX_AGE_MS) {
    return null;
  }
  if (!isValidLatitude(location.lat) || !isValidLongitude(location.lng)) {
    return null;
  }
  return {
    lat: location.lat,
    lng: location.lng,
    updatedAt: toIso(location.updated_at) ?? "",
  };
}

export async function readBookingDetail(
  row: MechanicBookingRow,
): Promise<BookingDetail | null> {
  const [itemRows, historyRows, reviewRow, location] = await Promise.all([
    listBookingItemRowsByBookingIds([row.booking_id]),
    listStatusHistoryRows(row.booking_id, DETAIL_HISTORY_LIMIT),
    findReviewRowByBookingId(row.booking_id),
    liveLocationFor(row, row.status ?? ""),
  ]);
  const items = groupItemsByBooking(itemRows).get(row.booking_id) ?? [];
  const summary = toWorkspaceSummary(row, items);
  if (!summary) return null;
  return {
    ...summary,
    items,
    timeline: historyRows
      .map(toTimelineEntry)
      .filter((entry) => entry !== null),
    cancelReason: row.cancel_reason ?? "",
    review: reviewRow ? toBookingReview(reviewRow) : null,
    location,
  };
}
