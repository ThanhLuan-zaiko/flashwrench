import type {
  MechanicBookingItemRow,
  MechanicBookingRow,
  MechanicLocationRow,
  MechanicPaymentRow,
  MechanicProfileRow,
  MechanicReviewRow,
  MechanicStatusHistoryRow,
  MechanicWorkloadRow,
} from "@/lib/mechanic/mechanic.types";
import type { AvailableMechanicRow } from "@/lib/mechanic/mechanic-directory.repository";

// Builders for the mechanic suites. Each test derives its own rows instead
// of mutating shared objects, mirroring tests/helpers/catalog.fixtures.ts.
// Times are fixed UTC instants; services never depend on "now" except for
// period bucketing, which tests inject through the `now` parameter.

export const MECHANIC_ID = "77777777-7777-4777-8777-777777777777";
export const MECHANIC_OTHER_ID = "88888888-8888-4888-8888-888888888888";
export const BOOKING_ID = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
export const CUSTOMER_ID = "cccccccc-1111-4111-8111-cccccccccccc";

export function makeWorkloadRow(
  overrides?: Partial<MechanicWorkloadRow>,
): MechanicWorkloadRow {
  return {
    mechanic_id: MECHANIC_ID,
    scheduled_at: new Date("2026-09-16T07:00:00.000Z"),
    booking_id: BOOKING_ID,
    status: "pending",
    total: 450000,
    vehicle_plate: "51A-12345",
    customer_name: "Nguyen Van An",
    ...overrides,
  };
}

export function makeBookingRow(
  overrides?: Partial<MechanicBookingRow>,
): MechanicBookingRow {
  return {
    booking_id: BOOKING_ID,
    customer_id: CUSTOMER_ID,
    customer_name: "Nguyen Van An",
    customer_phone: "0901234567",
    vehicle_plate: "51A-12345",
    vehicle_brand: "Toyota",
    vehicle_model: "Vios 2019",
    mechanic_id: MECHANIC_ID,
    zone_id: null,
    address: {
      full_text: "123 Le Loi, Quan 1, TP. Ho Chi Minh",
      lat: 10.772291,
      lng: 106.698007,
    },
    scheduled_at: new Date("2026-09-16T07:00:00.000Z"),
    timezone: "Asia/Ho_Chi_Minh",
    status: "pending",
    payment_status: "unpaid",
    total: 450000,
    notes: null,
    cancel_reason: null,
    created_at: new Date("2026-09-15T08:30:00.000Z"),
    updated_at: new Date("2026-09-15T08:30:00.000Z"),
    vehicle_id: null,
    mechanic_name: "Nguyen Van A",
    month_bucket: "2026-09",
    ...overrides,
  };
}

export function makeBookingItemRow(
  overrides?: Partial<MechanicBookingItemRow>,
): MechanicBookingItemRow {
  return {
    booking_id: BOOKING_ID,
    service_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    service_name: "Thay dau dong co",
    quantity: 1,
    unit_price: 450000,
    line_total: 450000,
    ...overrides,
  };
}

export function makeHistoryRow(
  overrides?: Partial<MechanicStatusHistoryRow>,
): MechanicStatusHistoryRow {
  return {
    changed_at: new Date("2026-09-15T08:30:00.000Z"),
    old_status: null,
    new_status: "pending",
    changed_by: CUSTOMER_ID,
    note: null,
    ...overrides,
  };
}

export function makeProfileRow(
  overrides?: Partial<MechanicProfileRow>,
): MechanicProfileRow {
  return {
    mechanic_id: MECHANIC_ID,
    display_name: "Nguyen Van A",
    skills: ["engine", "tire"],
    base_lat: 10.775,
    base_lng: 106.7,
    is_verified: true,
    is_online: true,
    is_available: true,
    rating_avg: null,
    rating_count: null,
    completed_jobs: 3,
    ...overrides,
  };
}

export function makeAvailableMechanicRow(
  overrides?: Partial<AvailableMechanicRow>,
): AvailableMechanicRow {
  return {
    mechanic_id: MECHANIC_ID,
    display_name: "Nguyen Van A",
    skills: ["engine", "tire"],
    base_lat: 10.775,
    base_lng: 106.7,
    is_online: true,
    is_verified: true,
    rating_avg: 4.8,
    rating_count: 12,
    completed_jobs: 30,
    ...overrides,
  };
}

export function makeLocationRow(
  overrides?: Partial<MechanicLocationRow>,
): MechanicLocationRow {
  return {
    mechanic_id: MECHANIC_ID,
    lat: 10.77,
    lng: 106.7,
    current_job_id: null,
    current_job_type: "none",
    updated_at: new Date("2026-09-16T08:00:00.000Z"),
    ...overrides,
  };
}

export function makePaymentRow(
  overrides?: Partial<MechanicPaymentRow>,
): MechanicPaymentRow {
  return {
    ref_type: "booking",
    ref_id: BOOKING_ID,
    payment_id: "99999999-9999-4999-8999-999999999999",
    amount: 450000,
    status: "paid",
    method: "cash",
    paid_at: new Date("2026-09-16T09:30:00.000Z"),
    created_at: new Date("2026-09-16T09:30:00.000Z"),
    ...overrides,
  };
}

export function makeReviewRow(
  overrides?: Partial<MechanicReviewRow>,
): MechanicReviewRow {
  return {
    target_type: "mechanic",
    target_id: MECHANIC_ID,
    review_id: "55555555-5555-4555-8555-555555555555",
    customer_name: "Nguyen Van An",
    booking_id: BOOKING_ID,
    rating: 5,
    title: "Lam rat tot",
    body: "Tho den dung gio, sua nhanh.",
    created_at: new Date("2026-09-16T10:00:00.000Z"),
    ...overrides,
  };
}
