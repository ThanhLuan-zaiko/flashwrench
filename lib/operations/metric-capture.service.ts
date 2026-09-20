import { listStatusBookingRefs } from "@/lib/dispatch/dispatch.repository";
import {
  listBookingRowsByIds,
  listWorkloadPage,
} from "@/lib/mechanic/mechanic-bookings.repository";
import type { MechanicBookingRow } from "@/lib/mechanic/mechanic.types";
import {
  MECHANIC_BOOKING_STATUSES,
  parseBookingStatus,
} from "@/lib/mechanic/mechanic-status";
import {
  metricHistoryPage,
  metricPaymentRefs,
  metricReceiptById,
  metricReviewPage,
} from "./metrics.repository";
import {
  type BookingMetric,
  type MetricPage,
  type RatingSnapshot,
  validMetricDate,
} from "./metrics.types";

export async function* metricPages<T>(
  read: (state: string | null) => Promise<MetricPage<T>>,
): AsyncGenerator<T[]> {
  let state: string | null = null;
  const seen = new Set<string>();
  do {
    const page = await read(state);
    yield page.rows;
    state = page.pageState;
    if (state && seen.has(state)) {
      throw new Error("Metric source repeated a paging state.");
    }
    if (state) seen.add(state);
  } while (state);
}

async function completionTime(bookingId: string): Promise<Date | null> {
  for await (const rows of metricPages((state) => metricHistoryPage(bookingId, state))) {
    const completion = rows.find((row) => row.status === "completed" && validMetricDate(row.at));
    if (completion) return completion.at;
  }
  return null;
}

export async function captureBookingMetric(
  booking: MechanicBookingRow,
): Promise<BookingMetric> {
  const status = parseBookingStatus(booking.status);
  if (!status) throw new Error("Unknown booking status in metric source.");
  const ids = new Set<string>([booking.booking_id]);
  for await (const refs of metricPages((state) => metricPaymentRefs(booking.booking_id, state))) {
    for (const id of refs) ids.add(id);
  }
  const payments: BookingMetric["payments"] = [];
  const idList = [...ids];
  for (let offset = 0; offset < idList.length; offset += 50) {
    const receipts = await Promise.all(idList.slice(offset, offset + 50).map(metricReceiptById));
    for (const receipt of receipts) {
      if (
        receipt && receipt.ref_type === "booking" &&
        receipt.ref_id === booking.booking_id &&
        receipt.customer_id === booking.customer_id
      ) payments.push(receipt);
    }
  }
  return {
    booking,
    status,
    completedAt: status === "completed" ? await completionTime(booking.booking_id) : null,
    payments,
  };
}

export async function captureMechanicBookingRows(mechanicId: string): Promise<MechanicBookingRow[]> {
  const seen = new Set<string>();
  const captured: MechanicBookingRow[] = [];
  for await (const refs of metricPages((state) => listWorkloadPage(mechanicId, state))) {
    const ids = refs.map((row) => row.booking_id).filter((id) => !seen.has(id));
    if (ids.length === 0) continue;
    for (const id of ids) seen.add(id);
    const rows = await listBookingRowsByIds([...new Set(ids)]);
    captured.push(...rows.filter((row) => row.mechanic_id === mechanicId));
  }
  return captured;
}

export async function captureMechanicMetrics(mechanicId: string): Promise<BookingMetric[]> {
  const rows = await captureMechanicBookingRows(mechanicId);
  const captured: BookingMetric[] = [];
  for (let index = 0; index < rows.length; index += 10) {
    captured.push(...await Promise.all(rows.slice(index, index + 10).map(captureBookingMetric)));
  }
  return captured;
}

export async function captureOperationsMetrics(month: string): Promise<BookingMetric[]> {
  const seen = new Set<string>();
  const captured: BookingMetric[] = [];
  for (const status of MECHANIC_BOOKING_STATUSES) {
    for await (const refs of metricPages((state) => listStatusBookingRefs(status, month, 50, state))) {
      const ids = refs.map((row) => row.booking_id).filter((id) => !seen.has(id));
      if (ids.length === 0) continue;
      for (const id of ids) seen.add(id);
      const rows = await listBookingRowsByIds([...new Set(ids)]);
      const matched = rows.filter((row) => row.month_bucket === month);
      for (let index = 0; index < matched.length; index += 10) {
        captured.push(...await Promise.all(matched.slice(index, index + 10).map(captureBookingMetric)));
      }
    }
  }
  return captured;
}

export async function captureMechanicRatings(mechanicId: string): Promise<RatingSnapshot> {
  const seen = new Set<string>();
  const reviews: RatingSnapshot["reviews"] = [];
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));
  let sum = 0;
  for await (const rows of metricPages((state) => metricReviewPage(mechanicId, state))) {
    for (const row of rows) {
      const key = row.booking_id ?? row.review_id;
      const rating = row.rating;
      if (
        seen.has(key) || row.target_type !== "mechanic" || row.target_id !== mechanicId ||
        rating === null || !Number.isInteger(rating) || rating < 1 || rating > 5
      ) continue;
      seen.add(key);
      sum += rating;
      distribution[5 - rating].count += 1;
      reviews.push(row);
    }
  }
  return {
    average: reviews.length ? Math.round(sum / reviews.length * 10) / 10 : 0,
    count: reviews.length,
    distribution,
    reviews,
  };
}
