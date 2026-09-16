import { describe, expect, test } from "bun:test";
import { validateCreateBookingInput } from "@/lib/booking/booking.validation";
import { makeBookingInput } from "../helpers/booking.fixtures";

// Pure validation behind POST /api/bookings and the /booking form:
// same rules on both sides, so the form never promises what the
// service rejects. No React, no mocks.

describe("validateCreateBookingInput", () => {
  test("accepts a complete booking and normalizes the values", () => {
    const result = validateCreateBookingInput(
      makeBookingInput({ vehiclePlate: "  51f-12345 " }),
    );
    expect("value" in result).toBe(true);
    if (!("value" in result)) return;
    expect(result.value.serviceId).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(result.value.vehiclePlate).toBe("51F-12345");
    expect(result.value.scheduledAt instanceof Date).toBe(true);
    expect(result.value.notes).toBe("Xe keu la khi de may.");
  });

  test("rejects a missing service and schedule", () => {
    const result = validateCreateBookingInput(
      makeBookingInput({ serviceId: "  ", scheduledAt: "" }),
    );
    expect("errors" in result).toBe(true);
    if (!("errors" in result)) return;
    expect(result.errors.serviceId).toContain("chọn dịch vụ");
    expect(result.errors.scheduledAt).toContain("khung giờ");
  });

  test("rejects past and too-soon schedules", () => {
    const past = validateCreateBookingInput(
      makeBookingInput({
        scheduledAt: new Date(Date.now() - 60 * 1000).toISOString(),
      }),
    );
    expect("errors" in past).toBe(true);

    const tooSoon = validateCreateBookingInput(
      makeBookingInput({
        scheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }),
    );
    expect("errors" in tooSoon).toBe(true);
    if (!("errors" in tooSoon)) return;
    expect(tooSoon.errors.scheduledAt).toContain("1 tiếng");
  });

  test("rejects schedules beyond the dispatch window", () => {
    const result = validateCreateBookingInput(
      makeBookingInput({
        scheduledAt: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    );
    expect("errors" in result).toBe(true);
    if (!("errors" in result)) return;
    expect(result.errors.scheduledAt).toContain("30 ngày");
  });

  test("rejects short addresses and bad plates", () => {
    const result = validateCreateBookingInput(
      makeBookingInput({ address: "Q3", vehiclePlate: "!!!" }),
    );
    expect("errors" in result).toBe(true);
    if (!("errors" in result)) return;
    expect(result.errors.address).toContain("10 đến 300");
    expect(result.errors.vehiclePlate).toContain("Biển số");
  });

  test("rejects overlong notes and trims optional fields", () => {
    const long = validateCreateBookingInput(
      makeBookingInput({ notes: "x".repeat(501) }),
    );
    expect("errors" in long).toBe(true);

    const trimmed = validateCreateBookingInput(
      makeBookingInput({ province: "   ", notes: "" }),
    );
    expect("value" in trimmed).toBe(true);
    if (!("value" in trimmed)) return;
    expect(trimmed.value.province).toBeNull();
    expect(trimmed.value.notes).toBeNull();
  });

  test("accepts map coordinates and an empty mechanic choice", () => {
    const result = validateCreateBookingInput(
      makeBookingInput({ lat: 10.7769, lng: 106.7009, mechanicId: "  " }),
    );
    expect("value" in result).toBe(true);
    if (!("value" in result)) return;
    expect(result.value.lat).toBe(10.7769);
    expect(result.value.lng).toBe(106.7009);
    expect(result.value.mechanicId).toBeNull();
  });

  test("rejects half or out-of-range coordinates", () => {
    const half = validateCreateBookingInput(
      makeBookingInput({ lat: 10.7769, lng: null }),
    );
    expect("errors" in half).toBe(true);
    if (!("errors" in half)) return;
    expect(half.errors.location).toContain("bản đồ");

    const wild = validateCreateBookingInput(
      makeBookingInput({ lat: 120, lng: 200 }),
    );
    expect("errors" in wild).toBe(true);
    if (!("errors" in wild)) return;
    expect(wild.errors.location).toContain("bản đồ");
  });

  test("requires an explicit offset on the schedule instant", () => {
    const wallClock = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: "2026-09-17T09:00" }),
    );
    expect("errors" in wallClock).toBe(true);
    if (!("errors" in wallClock)) return;
    expect(wallClock.errors.scheduledAt).toContain("múi giờ");

    // Same wall time written two ways: bare (server-zone dependent,
    // rejected) versus offset-pinned (unambiguous, window-checked).
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const plusSeven = new Date(future.getTime() + 7 * 60 * 60 * 1000);
    const offsetForm = `${plusSeven.getUTCFullYear()}-${pad(plusSeven.getUTCMonth() + 1)}-${pad(plusSeven.getUTCDate())}T${pad(plusSeven.getUTCHours())}:${pad(plusSeven.getUTCMinutes())}:00+07:00`;
    const offset = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: offsetForm }),
    );
    expect("value" in offset).toBe(true);
    if (!("value" in offset)) return;
    expect(offset.value.scheduledAt.getTime()).toBe(
      Math.floor(future.getTime() / 60000) * 60000,
    );
  });

  test("accepts valid zones and rejects garbage ones", () => {
    const valid = validateCreateBookingInput(
      makeBookingInput({ timeZone: "America/New_York" }),
    );
    expect("value" in valid).toBe(true);
    if (!("value" in valid)) return;
    expect(valid.value.timeZone).toBe("America/New_York");

    const blank = validateCreateBookingInput(
      makeBookingInput({ timeZone: undefined }),
    );
    expect("value" in blank).toBe(true);
    if (!("value" in blank)) return;
    expect(blank.value.timeZone).toBeNull();

    const garbage = validateCreateBookingInput(
      makeBookingInput({ timeZone: "Mars/Olympus" }),
    );
    expect("errors" in garbage).toBe(true);
    if (!("errors" in garbage)) return;
    expect(garbage.errors.timeZone).toContain("Múi giờ");
  });
});
