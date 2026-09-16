import { describe, expect, test } from "bun:test";
import { formatDateTime, formatShortDateTime } from "@/lib/datetime/format";
import {
  DEFAULT_TIME_ZONE,
  isValidTimeZone,
  normalizeTimeZone,
} from "@/lib/datetime/timezone";

// Pure timezone rules: explicit zones everywhere, safe fallbacks,
// no server-local assumptions. No mocks.

describe("timezone helpers", () => {
  test("pins the documented product default zone", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Asia/Ho_Chi_Minh");
  });

  test("accepts real IANA zones and rejects garbage", () => {
    expect(isValidTimeZone("Asia/Ho_Chi_Minh")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("GMT+7")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(isValidTimeZone(7)).toBe(false);
  });

  test("normalizes zones without throwing", () => {
    expect(normalizeTimeZone("  Asia/Bangkok  ")).toBe("Asia/Bangkok");
    expect(normalizeTimeZone("Mars/Olympus")).toBeNull();
    expect(normalizeTimeZone(undefined)).toBeNull();
  });
});

describe("formatDateTime", () => {
  // 2026-09-16T02:00:00Z = 09:00 in +07, previous day 22:00 in New York.
  const INSTANT = "2026-09-16T02:00:00.000Z";

  test("renders the same instant in the requested zone", () => {
    const saigon = formatDateTime(INSTANT, {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const newYork = formatDateTime(INSTANT, {
      timeZone: "America/New_York",
    });
    expect(saigon).toContain("16/09/2026");
    expect(saigon).toContain("09:00");
    expect(saigon).toContain("GMT+7");
    expect(newYork).toContain("15/09/2026");
    expect(newYork).toContain("22:00");
    expect(newYork).not.toBe(saigon);
  });

  test("falls back safely on bad input", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(formatShortDateTime(undefined)).toBe("—");
  });
});
