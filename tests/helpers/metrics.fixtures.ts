import type { BookingMetric, MetricReceipt, RatingSnapshot } from "@/lib/operations/metrics.types";
import { makeBookingRow, makePaymentRow, CUSTOMER_ID, MECHANIC_ID } from "./mechanic.fixtures";

export function metricReceipt(overrides: Partial<MetricReceipt> = {}): MetricReceipt {
  return { ...makePaymentRow(), customer_id: CUSTOMER_ID, ...overrides };
}

export function metricRecord(overrides: Partial<BookingMetric> = {}): BookingMetric {
  return {
    booking: makeBookingRow({ status: "completed", month_bucket: "2026-09", payment_status: "unpaid" }),
    status: "completed", completedAt: new Date("2026-09-16T08:00:00Z"), payments: [],
    ...overrides,
  };
}

export function emptyRatingSnapshot(): RatingSnapshot {
  return { average: 0, count: 0, distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 })), reviews: [] };
}

export function sequentialMetricRecords(count: number): BookingMetric[] {
  return Array.from({ length: count }, (_, index) => {
    const bookingId = `aaaaaaaa-1111-4111-8111-${String(index).padStart(12, "0")}`;
    return metricRecord({
      booking: makeBookingRow({ booking_id: bookingId, mechanic_id: MECHANIC_ID, status: "completed", total: 500, month_bucket: "2026-09" }),
      payments: [metricReceipt({ payment_id: bookingId, ref_id: bookingId, amount: 200 })],
    });
  });
}
