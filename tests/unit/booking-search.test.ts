import { describe, expect, test } from "bun:test";
import {
  type BookingSearchable,
  matchesBookingSearch,
  normalizeBookingSearch,
} from "@/lib/booking/booking-search";

const booking: BookingSearchable = {
  id: "booking-123",
  customerName: "Trần Văn Khách",
  vehiclePlate: "51A-12345",
  mechanicName: "Nguyễn Văn An",
  addressText: "123 Lê Lợi, Quận 1",
  serviceNames: ["Thay ắc quy"],
  status: "en_route",
};

describe("booking history search", () => {
  test("normalizes Vietnamese accents and spacing", () => {
    expect(normalizeBookingSearch("  Đang di chuyển  ")).toBe("dang di chuyen");
  });

  test("matches customer, service, mechanic, address, plate, id and status", () => {
    for (const query of [
      "ac quy",
      "tran van khach",
      "nguyen van an",
      "le loi",
      "51a-12345",
      "booking-123",
      "dang di chuyen",
    ]) {
      expect(matchesBookingSearch(booking, normalizeBookingSearch(query))).toBe(
        true,
      );
    }
  });

  test("returns false for an unrelated search", () => {
    expect(matchesBookingSearch(booking, "honda")).toBe(false);
  });
});
