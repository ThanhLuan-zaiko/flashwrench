import { describe, expect, test } from "bun:test";
import { validateCreateBookingInput } from "@/lib/booking/booking.validation";
import { makeBookingInput } from "../helpers/booking.fixtures";

// The admin-tuned scheduling window behind POST /api/bookings and the
// /booking form: lead floor, advance ceiling and shop working hours
// all land in the same ScheduleWindowOptions bag.

describe("validateCreateBookingInput — tuned window", () => {
  test("honours an admin-tuned minLeadDays option", () => {
    // 1 day ahead: fails the default 2-day floor, passes a 0-day shop.
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const strict = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: soon }),
      { minLeadDays: 2 },
    );
    expect("errors" in strict).toBe(true);
    if (!("errors" in strict)) return;
    expect(strict.errors.scheduledAt).toContain("2 ngày");

    const open = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: soon }),
      { minLeadDays: 0 },
    );
    expect("value" in open).toBe(true);

    // 0-day shop still rejects the past, with a lead-free message.
    const past = validateCreateBookingInput(
      makeBookingInput({
        scheduledAt: new Date(Date.now() - 60 * 1000).toISOString(),
      }),
      { minLeadDays: 0 },
    );
    expect("errors" in past).toBe(true);
    if (!("errors" in past)) return;
    expect(past.errors.scheduledAt).toContain("tương lai");

    // Short-staffed 4-day floor rejects a 3-day slot.
    const threeDays = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const short = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: threeDays }),
      { minLeadDays: 4 },
    );
    expect("errors" in short).toBe(true);
    if (!("errors" in short)) return;
    expect(short.errors.scheduledAt).toContain("4 ngày");
  });

  test("honours an admin-tuned maxAdvanceDays ceiling", () => {
    const far = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const capped = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: far }),
      { maxAdvanceDays: 30 },
    );
    expect("errors" in capped).toBe(true);
    if (!("errors" in capped)) return;
    expect(capped.errors.scheduledAt).toContain("30 ngày");

    // A slot inside the tuned window still passes.
    const inside = validateCreateBookingInput(
      makeBookingInput({
        scheduledAt: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
      { minLeadDays: 2, maxAdvanceDays: 30 },
    );
    expect("value" in inside).toBe(true);
  });

  test("honours the shop working-hours window when enabled", () => {
    const openWindow = {
      opensAtMin: 7 * 60,
      closesAtMin: 20 * 60,
      timeZone: "Asia/Ho_Chi_Minh",
    };
    // 10:00 shop-local on a far-future day sits inside the window.
    const inside = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: "2030-06-15T10:00:00+07:00" }),
      { minLeadDays: 0, openWindow },
    );
    expect("value" in inside).toBe(true);

    // 02:00 shop-local is outside — the error names the open range.
    const outside = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: "2030-06-15T02:00:00+07:00" }),
      { minLeadDays: 0, openWindow },
    );
    expect("errors" in outside).toBe(true);
    if (!("errors" in outside)) return;
    expect(outside.errors.scheduledAt).toContain("07:00–20:00");

    // A slot at exactly close-time (20:00) is outside [open, close).
    const atClose = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: "2030-06-15T20:00:00+07:00" }),
      { minLeadDays: 0, openWindow },
    );
    expect("errors" in atClose).toBe(true);

    // Disabled window keeps the any-hour rule.
    const anyHour = validateCreateBookingInput(
      makeBookingInput({ scheduledAt: "2030-06-15T02:00:00+07:00" }),
      { minLeadDays: 0, openWindow: null },
    );
    expect("value" in anyHour).toBe(true);
  });
});
