import type { CreateBookingInput } from "@/lib/booking/booking.types";

// Builders for the customer booking suites. Each test derives its own
// input instead of mutating shared objects, mirroring
// tests/helpers/auth.fixtures.ts.
export function makeBookingInput(
  overrides?: Partial<CreateBookingInput>,
): CreateBookingInput {
  return {
    serviceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
