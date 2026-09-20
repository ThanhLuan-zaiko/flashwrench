import { describe, expect, test } from "bun:test";
import { toBookingPrefill } from "@/components/booking/booking-prefill";
import type { BookingSummary } from "@/lib/booking/workspace.types";

// Pure mapper behind the quick-rebook prefill: the customer's latest
// booking seeds pin, address, vehicle and mechanic. No React, no mocks.

function makeSummary(overrides?: Partial<BookingSummary>): BookingSummary {
  return {
    id: "booking-1",
    customerName: "Nguyen Van A",
    customerPhone: "0901234567",
    vehiclePlate: "51F-12345",
    vehicleBrand: "Honda",
    vehicleModel: "Wave Alpha",
    addressText: "123 Nguyen Trai, Phuong 5, Quan 3",
    addressLat: 10.7626,
    addressLng: 106.6601,
    scheduledAt: null,
    timezone: "Asia/Ho_Chi_Minh",
    status: "completed",
    paymentState: "paid",
    total: 150000,
    serviceNames: ["Thay ac quy"],
    notes: "Xe keu la khi de may.",
    createdAt: null,
    updatedAt: null,
    customerId: "customer-1",
    mechanicId: "mechanic-1",
    mechanicName: "Tran B",
    vehicleId: null,
    ...overrides,
  };
}

describe("toBookingPrefill", () => {
  test("returns null without a booking", () => {
    expect(toBookingPrefill(null)).toBeNull();
  });

  test("maps the saved snapshot into form state", () => {
    expect(toBookingPrefill(makeSummary())).toEqual({
      coords: { lat: 10.7626, lng: 106.6601 },
      address: {
        address: "123 Nguyen Trai, Phuong 5, Quan 3",
        province: "",
        district: "",
        ward: "",
        street: "",
      },
      vehicle: {
        vehiclePlate: "51F-12345",
        vehicleBrand: "Honda",
        vehicleModel: "Wave Alpha",
        notes: "Xe keu la khi de may.",
      },
      mechanicId: "mechanic-1",
    });
  });

  test("keeps partial snapshots without a pinned point", () => {
    const prefill = toBookingPrefill(
      makeSummary({ addressLat: null, addressLng: null, mechanicId: null }),
    );
    expect(prefill?.coords).toBeNull();
    expect(prefill?.address.address).toBe("123 Nguyen Trai, Phuong 5, Quan 3");
  });

  test("drops coords when only one axis is stored", () => {
    const prefill = toBookingPrefill(makeSummary({ addressLng: null }));
    expect(prefill?.coords).toBeNull();
  });

  test("returns null for a booking carrying nothing reusable", () => {
    expect(
      toBookingPrefill(
        makeSummary({
          addressText: "",
          addressLat: null,
          addressLng: null,
          vehiclePlate: "",
          mechanicId: null,
        }),
      ),
    ).toBeNull();
  });
});
