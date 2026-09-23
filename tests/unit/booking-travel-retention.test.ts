import { describe, expect, test } from "bun:test";
import { BOOKING_TRAVEL_TTL_SECONDS } from "@/lib/booking/booking-travel.constants";

describe("booking travel retention", () => {
  test("keeps mechanic route points for one year", () => {
    expect(BOOKING_TRAVEL_TTL_SECONDS).toBe(365 * 24 * 60 * 60);
  });
});
