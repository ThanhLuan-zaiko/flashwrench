import { describe, expect, test } from "bun:test";
import {
  defaultScheduled,
  maxScheduled,
  minScheduled,
  toDatetimeLocal,
} from "@/components/booking/booking-datetime";

// Pure datetime-local helpers behind the schedule input. No React,
// no mocks; bounds mirror the service validation window.

describe("booking datetime helpers", () => {
  test("formats local datetime-local strings", () => {
    const date = new Date(2026, 8, 16, 9, 5);
    expect(toDatetimeLocal(date)).toBe("2026-09-16T09:05");
  });

  test("defaults to tomorrow at 9:00", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expected = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}T09:00`;
    expect(defaultScheduled()).toBe(expected);
  });

  test("bounds stay inside the service window", () => {
    const min = new Date(minScheduled()).getTime();
    const max = new Date(maxScheduled()).getTime();
    expect(min).toBeGreaterThan(Date.now());
    expect(max).toBeGreaterThan(min);
    expect(max - Date.now()).toBeLessThanOrEqual(31 * 24 * 60 * 60 * 1000);
  });
});
