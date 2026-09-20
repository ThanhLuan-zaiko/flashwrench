import type { BookingReviewRow } from "@/lib/booking/review.repository";
import type { PaymentRow } from "@/lib/payments/booking-payment.repository";
import type {
  MaintenanceRow,
  VehicleRow,
} from "@/lib/vehicles/vehicle.repository";

export const VEHICLE_ID = "dddddddd-2222-4222-8222-dddddddddddd";

export function makeVehicleRow(overrides?: Partial<VehicleRow>): VehicleRow {
  return {
    vehicle_id: VEHICLE_ID,
    owner_id: "cccccccc-1111-4111-8111-cccccccccccc",
    license_plate: "51A12345",
    brand: "Toyota",
    model: "Vios",
    year: 2019,
    vehicle_type: "car",
    odometer_km: 45000,
    is_default: false,
    is_archived: false,
    created_at: new Date("2026-09-10T08:00:00.000Z"),
    updated_at: new Date("2026-09-10T08:00:00.000Z"),
    ...overrides,
  };
}

export function makeReviewBookingRow(
  overrides?: Partial<BookingReviewRow>,
): BookingReviewRow {
  return {
    booking_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    review_id: "55555555-5555-4555-8555-555555555555",
    customer_id: "cccccccc-1111-4111-8111-cccccccccccc",
    mechanic_id: "77777777-7777-4777-8777-777777777777",
    customer_name: "Nguyen Van An",
    rating: 5,
    body: "Tho den dung gio.",
    created_at: new Date("2026-09-16T10:00:00.000Z"),
    ...overrides,
  };
}

export function makePaymentReceiptRow(
  overrides?: Partial<PaymentRow>,
): PaymentRow {
  return {
    payment_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    ref_type: "booking",
    ref_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    customer_id: "cccccccc-1111-4111-8111-cccccccccccc",
    amount: 450000,
    method: "cod",
    status: "paid",
    paid_at: new Date("2026-09-16T10:00:00.000Z"),
    created_at: new Date("2026-09-16T10:00:00.000Z"),
    ...overrides,
  };
}

export function makeMaintenanceRow(
  overrides?: Partial<MaintenanceRow>,
): MaintenanceRow {
  return {
    serviced_at: new Date("2026-09-16T09:00:00.000Z"),
    record_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    source_type: "booking",
    source_id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    mechanic_name: "Nguyen Van A",
    summary: "Thay dau dong co",
    cost: 450000,
    odometer_km: 45000,
    next_due_at: null,
    next_due_km: null,
    ...overrides,
  };
}
