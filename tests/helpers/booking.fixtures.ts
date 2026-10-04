import type { InsertCustomerBookingParams } from "@/lib/booking/booking.repository";
import type {
  BookingServiceSnapshot,
  CreateBookingInput,
} from "@/lib/booking/booking.types";

// Builders for the customer booking suites. Each test derives its own
// input instead of mutating shared objects, mirroring
// tests/helpers/auth.fixtures.ts.
export function makeBookingInput(
  overrides?: Partial<CreateBookingInput>,
): CreateBookingInput {
  return {
    serviceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timeZone: "Asia/Ho_Chi_Minh",
    address: "123 Nguyen Trai, Phuong 5, Quan 3, TP Ho Chi Minh",
    province: "TP Ho Chi Minh",
    district: "Quan 3",
    ward: "Phuong 5",
    street: "123 Nguyen Trai",
    vehiclePlate: "51F-12345",
    vehicleBrand: "Honda",
    vehicleModel: "Wave Alpha",
    notes: "Xe keu la khi de may.",
    ...overrides,
  };
}

export function makeBookingServiceSnapshot(
  overrides?: Partial<BookingServiceSnapshot>,
): BookingServiceSnapshot {
  return {
    serviceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    serviceName: "Thay dầu động cơ",
    quantity: 1,
    unitPrice: 199000,
    lineTotal: 199000,
    durationMin: 60,
    priceUnit: "per_job",
    ...overrides,
  };
}

export function makeBookingInsert(
  overrides?: Partial<InsertCustomerBookingParams>,
): InsertCustomerBookingParams {
  const scheduledAt = new Date("2026-10-08T07:00:00.000Z");
  return {
    bookingId: "99999999-9999-4999-8999-999999999999",
    customerId: "cccccccc-1111-4111-8111-cccccccccccc",
    customerName: "Test Customer",
    customerPhone: "0909999888",
    customerEmail: "customer@example.com",
    vehicleId: null,
    vehiclePlate: "51F-12345",
    vehicleBrand: "Honda",
    vehicleModel: "Wave Alpha",
    address: {
      province: null,
      district: null,
      ward: null,
      street: null,
      full_text: "123 Example Street",
      lat: null,
      lng: null,
    },
    scheduledAt,
    timezone: "Asia/Ho_Chi_Minh",
    durationMin: 60,
    status: "pending",
    paymentStatus: "unpaid",
    subtotal: 199000,
    discount: 0,
    couponCode: null,
    total: 199000,
    notes: null,
    monthBucket: "2026-10",
    createdAt: scheduledAt,
    updatedAt: scheduledAt,
    mechanicId: null,
    mechanicName: null,
    items: [makeBookingServiceSnapshot()],
    ...overrides,
  };
}
