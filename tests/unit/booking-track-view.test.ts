import { describe, expect, test } from "bun:test";
import {
  BOOKING_TRACK_STAGES,
  bookingTicketCode,
  bookingTrackStage,
  distanceKm,
  estimateEtaMinutes,
  formatKm,
} from "@/lib/track/booking-track-view";

// Pure view helpers for the public booking tracker. No mocks.

describe("bookingTrackStage", () => {
  test("collapses the six statuses into four customer stages", () => {
    expect(BOOKING_TRACK_STAGES).toHaveLength(4);
    expect(bookingTrackStage("pending")).toBe(0);
    expect(bookingTrackStage("confirmed")).toBe(0);
    expect(bookingTrackStage("mechanic_assigned")).toBe(1);
    expect(bookingTrackStage("en_route")).toBe(1);
    expect(bookingTrackStage("in_progress")).toBe(2);
    expect(bookingTrackStage("completed")).toBe(3);
  });

  test("falls back to the first stage for unknown statuses", () => {
    expect(bookingTrackStage("mystery")).toBe(0);
    expect(bookingTrackStage("")).toBe(0);
  });
});

describe("distanceKm", () => {
  test("is zero for the same point", () => {
    expect(
      distanceKm({ lat: 10.77, lng: 106.7 }, { lat: 10.77, lng: 106.7 }),
    ).toBe(0);
  });

  test("measures a known city hop to one decimal", () => {
    // Ben Thanh market to Phu My Hung, about 6 km apart.
    const km = distanceKm(
      { lat: 10.7725, lng: 106.698 },
      { lat: 10.7296, lng: 106.7188 },
    );
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(6);
    expect(Number.isInteger(km * 10)).toBe(true);
  });
});

describe("estimateEtaMinutes", () => {
  test("uses the city speed and rounds up", () => {
    expect(estimateEtaMinutes(3.2)).toBe(10);
    expect(estimateEtaMinutes(10)).toBe(30);
  });

  test("never drops below one minute", () => {
    expect(estimateEtaMinutes(0)).toBe(1);
    expect(estimateEtaMinutes(0.05)).toBe(1);
    expect(estimateEtaMinutes(Number.NaN)).toBe(1);
  });
});

describe("formatKm", () => {
  test("uses the Vietnamese decimal comma", () => {
    expect(formatKm(3.2)).toBe("3,2 km");
    expect(formatKm(12)).toBe("12 km");
  });
});

describe("bookingTicketCode", () => {
  test("matches the shop FW-XXXXXXXX code shape", () => {
    expect(bookingTicketCode("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d")).toBe(
      "FW-1A2B3C4D",
    );
  });
});
