import { describe, expect, test } from "bun:test";
import {
  defaultScheduled,
  maxScheduled,
  minScheduled,
  toDatetimeLocal,
} from "@/components/booking/booking-datetime";

// Pure datetime-local helpers behind the schedule input. No React,
// no mocks; the floor mirrors the service lead-time rule.

describe("booking datetime helpers", () => {
  test("formats local datetime-local strings", () => {
    const date = new Date(2026, 8, 16, 9, 5);
    expect(toDatetimeLocal(date)).toBe("2026-09-16T09:05");
  });

  test("defaults to three days out at 9:00", () => {
    const day = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const expected = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}T09:00`;
    expect(defaultScheduled()).toBe(expected);
  });

  test("floor sits at the 2-day lead with no upper bound", () => {
    const min = new Date(minScheduled()).getTime();
    expect(min - Date.now()).toBeGreaterThan(47 * 60 * 60 * 1000);
    expect(min - Date.now()).toBeLessThanOrEqual(49 * 60 * 60 * 1000);
  });

  test("floor and default track a tuned lead time", () => {
    const min = new Date(minScheduled(4)).getTime();
    expect(min - Date.now()).toBeGreaterThan(95 * 60 * 60 * 1000);
    expect(min - Date.now()).toBeLessThanOrEqual(97 * 60 * 60 * 1000);

    const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const expected = `${fiveDays.getFullYear()}-${String(fiveDays.getMonth() + 1).padStart(2, "0")}-${String(fiveDays.getDate()).padStart(2, "0")}T09:00`;
    expect(defaultScheduled(4)).toBe(expected);

    // Same-day shop: floor is now, default lands one day out at 9:00.
    expect(
      new Date(minScheduled(0)).getTime() - Date.now(),
    ).toBeLessThanOrEqual(60 * 1000);
    const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expectedZero = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}T09:00`;
    expect(defaultScheduled(0)).toBe(expectedZero);
  });

  test("caps the window only when a tuned max applies", () => {
    // 0/disabled means no max attribute at all.
    expect(maxScheduled(0)).toBe("");
    expect(maxScheduled()).toBe("");

    const max = new Date(maxScheduled(30)).getTime();
    expect(max - Date.now()).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
    expect(max - Date.now()).toBeLessThanOrEqual(31 * 24 * 60 * 60 * 1000);

    // The default slot clamps to the cap when floor+1 would overshoot.
    const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const expected = `${fiveDays.getFullYear()}-${pad(fiveDays.getMonth() + 1)}-${pad(fiveDays.getDate())}T09:00`;
    expect(defaultScheduled(4, 5)).toBe(expected);
  });
});
