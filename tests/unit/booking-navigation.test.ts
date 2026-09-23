import { describe, expect, test } from "bun:test";
import { BOOKING_SUCCESS_REDIRECT } from "@/lib/booking/booking-navigation";

describe("booking success navigation", () => {
  test("sends customers to history after a booking is created", () => {
    expect(BOOKING_SUCCESS_REDIRECT).toBe("/history");
  });
});
