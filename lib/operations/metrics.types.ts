import type {
  MechanicBookingRow,
  MechanicBookingStatus,
  MechanicPaymentRow,
  MechanicReviewRow,
} from "@/lib/mechanic/mechanic.types";

export type MetricPage<T> = { rows: T[]; pageState: string | null };

export type MetricReceipt = MechanicPaymentRow & {
  customer_id: string | null;
};

export type BookingMetric = {
  booking: MechanicBookingRow;
  status: MechanicBookingStatus;
  completedAt: Date | null;
  payments: MetricReceipt[];
};

export type MetricCoverage = {
  generatedAt: string;
  timeZone: "Asia/Ho_Chi_Minh";
  undatedCompletions: number;
  undatedPayments: number;
  unplacedBookings: number;
};

export type RatingSnapshot = {
  average: number;
  count: number;
  distribution: { stars: number; count: number }[];
  reviews: MechanicReviewRow[];
};

export type OperationsSnapshot = {
  scope: MetricCoverage & { kind: "scheduled-month"; month: string };
  totals: {
    bookings: number;
    open: number;
    unassigned: number;
    completed: number;
    cancelled: number;
    noShow: number;
    bookingValue: number;
    collected: number;
    outstanding: number;
    completionRate: number;
  };
  statuses: { status: MechanicBookingStatus; count: number }[];
  daily: { day: string; bookings: number; completed: number; value: number }[];
};

export function validMetricDate(value: Date | null): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function metricMoney(value: number | null): number {
  if (value === null || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("Invalid monetary value in metric source.");
  }
  return value;
}

export function addMetricMoney(left: number, right: number): number {
  return metricMoney(left + right);
}

export function metricCoverage(now: Date): MetricCoverage {
  return {
    generatedAt: now.toISOString(),
    timeZone: "Asia/Ho_Chi_Minh",
    undatedCompletions: 0,
    undatedPayments: 0,
    unplacedBookings: 0,
  };
}
