import { describe, expect, test } from "bun:test";
import {
  defaultScheduled,
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
});
