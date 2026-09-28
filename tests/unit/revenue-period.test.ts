import { describe, expect, test } from "bun:test";
import { normalizeRevenueAnchor } from "@/lib/revenue/revenue-period";

const NOW = new Date(Date.UTC(2026, 8, 28, 15, 30)); // 2026-09-28T15:30Z

describe("normalizeRevenueAnchor", () => {
  test("missing anchor falls back to the range containing now", () => {
    expect(normalizeRevenueAnchor("day", undefined, NOW)).toBe("2026-09-28");
    expect(normalizeRevenueAnchor("week", null, NOW)).toBe("2026-09-28");
    expect(normalizeRevenueAnchor("month", "", NOW)).toBe("2026-09");
    expect(normalizeRevenueAnchor("year", undefined, NOW)).toBe("2026");
  });

  test("day and week accept a day key; week snaps to its Monday", () => {
    expect(normalizeRevenueAnchor("day", "2026-09-20", NOW)).toBe("2026-09-20");
    // 2026-09-24 is a Thursday -> the containing week starts 2026-09-21.
    expect(normalizeRevenueAnchor("week", "2026-09-24", NOW)).toBe(
      "2026-09-21",
    );
  });

  test("month accepts both month keys and full day keys", () => {
    expect(normalizeRevenueAnchor("month", "2026-09", NOW)).toBe("2026-09");
    expect(normalizeRevenueAnchor("month", "2026-09-28", NOW)).toBe("2026-09");
  });

  test("year accepts year, month and day keys", () => {
    expect(normalizeRevenueAnchor("year", "2026", NOW)).toBe("2026");
    expect(normalizeRevenueAnchor("year", "2026-09", NOW)).toBe("2026");
    expect(normalizeRevenueAnchor("year", "2026-09-28", NOW)).toBe("2026");
  });

  test("malformed anchors and non-strings are rejected", () => {
    for (const raw of ["28-09-2026", "2026/09", "abc", 202609, {}, []]) {
      expect(normalizeRevenueAnchor("month", raw, NOW)).toBeNull();
      expect(normalizeRevenueAnchor("year", raw, NOW)).toBeNull();
      expect(normalizeRevenueAnchor("day", raw, NOW)).toBeNull();
    }
  });
});
