// Pure aggregation behind the dispatch pulse: hour buckets in the shop
// zone, yesterday detection across month edges, funnel folding and the
// display helpers. No I/O, no mocks.
import { describe, expect, test } from "bun:test";
import {
  changeVsYesterday,
  formatChange,
  formatMinutes,
  formatRate,
  formatWait,
  hourLabels,
  rescueCode,
} from "@/app/dispatch/components/pulse/pulse-format";
import {
  bucketByHour,
  buildFunnel,
  buildRescueSteps,
  completionRate,
  previousDayKey,
} from "@/lib/dispatch/dispatch-pulse";
import {
  firstResponseMinutes,
  summarizeResponses,
} from "@/lib/dispatch/dispatch-pulse-response";

const at = (iso: string) => new Date(iso);
const NOW = at("2026-09-15T10:30:00+07:00");

describe("previousDayKey", () => {
  test("crosses month and year edges", () => {
    expect(previousDayKey("2026-09-15")).toBe("2026-09-14");
    expect(previousDayKey("2026-10-01")).toBe("2026-09-30");
    expect(previousDayKey("2026-01-01")).toBe("2025-12-31");
  });
});

describe("bucketByHour", () => {
  test("buckets today up to the current hour and yesterday for 24 hours", () => {
    const result = bucketByHour(
      [
        {
          status: "pending",
          scheduledAt: [
            at("2026-09-15T08:10:00+07:00"),
            at("2026-09-15T08:50:00+07:00"),
            at("2026-09-14T21:00:00+07:00"),
          ],
        },
        { status: "completed", scheduledAt: [at("2026-09-15T00:05:00+07:00")] },
      ],
      NOW,
    );
    expect(result.today).toHaveLength(11);
    expect(result.today[8]).toBe(2);
    expect(result.today[0]).toBe(1);
    expect(result.yesterday).toHaveLength(24);
    expect(result.yesterday[21]).toBe(1);
    expect(result.todayByStatus.get("pending")).toBe(2);
  });

  test("uses the shop zone, not UTC, for the day boundary", () => {
    // 2026-09-14T18:30Z is 01:30 on the 15th in Ho Chi Minh City.
    const result = bucketByHour(
      [{ status: "pending", scheduledAt: [at("2026-09-14T18:30:00Z")] }],
      NOW,
    );
    expect(result.today[1]).toBe(1);
    expect(result.yesterday.every((count) => count === 0)).toBe(true);
  });

  test("cancelled and no-show stay out of the load but are counted by status", () => {
    const result = bucketByHour(
      [
        { status: "cancelled", scheduledAt: [at("2026-09-15T09:00:00+07:00")] },
        { status: "no_show", scheduledAt: [at("2026-09-15T09:00:00+07:00")] },
      ],
      NOW,
    );
    expect(result.today[9]).toBe(0);
    expect(result.todayByStatus.get("cancelled")).toBe(1);
    expect(result.todayByStatus.get("no_show")).toBe(1);
  });

  test("ignores missing dates and other days", () => {
    const result = bucketByHour(
      [
        {
          status: "pending",
          scheduledAt: [null, at("invalid"), at("2026-09-10T09:00:00+07:00")],
        },
      ],
      NOW,
    );
    expect(result.today.every((count) => count === 0)).toBe(true);
    expect(result.todayByStatus.size).toBe(0);
  });
});

describe("funnel, rescues and rate", () => {
  test("folds statuses into board stages", () => {
    const funnel = buildFunnel(
      new Map([
        ["pending", 3],
        ["confirmed", 1],
        ["mechanic_assigned", 2],
        ["in_progress", 4],
        ["completed", 5],
        ["cancelled", 9],
      ]),
    );
    expect(funnel.map((step) => step.count)).toEqual([3, 3, 4, 5]);
    expect(completionRate(funnel)).toBeCloseTo(5 / 15);
  });

  test("completion rate is 0 on an empty day", () => {
    expect(completionRate(buildFunnel(new Map()))).toBe(0);
  });

  test("groups rescue statuses", () => {
    const steps = buildRescueSteps(
      new Map([
        ["open", 1],
        ["dispatched", 2],
        ["en_route", 1],
        ["arrived", 3],
      ]),
    );
    expect(steps.map((step) => step.count)).toEqual([3, 1, 3]);
  });
});

describe("pulse-format", () => {
  test("compares against the same hours yesterday", () => {
    expect(changeVsYesterday([2, 2], [1, 1, 50])).toBe(100);
    expect(changeVsYesterday([1], [0, 9])).toBeNull();
  });

  test("formats change, rate and hour labels in Vietnamese", () => {
    expect(formatChange(12.4)).toBe("+12% so với cùng giờ hôm qua");
    expect(formatChange(-30)).toBe("-30% so với cùng giờ hôm qua");
    expect(formatChange(null)).toBe("Chưa có số liệu hôm qua để so sánh");
    expect(formatRate(0.456)).toBe("46%");
    expect(hourLabels()).toHaveLength(24);
    expect(hourLabels()[23]).toBe("23h");
  });
});

describe("first response time", () => {
  const t = (minute: number) => new Date(Date.UTC(2026, 8, 15, 3, minute));

  test("measures creation to the first non-pending status", () => {
    expect(
      firstResponseMinutes([
        { status: "completed", at: t(50) },
        { status: "confirmed", at: t(7) },
        { status: "pending", at: t(0) },
      ]),
    ).toBe(7);
  });

  test("returns null without a creation row or a response", () => {
    expect(
      firstResponseMinutes([{ status: "confirmed", at: t(3) }]),
    ).toBeNull();
    expect(firstResponseMinutes([{ status: "pending", at: t(0) }])).toBeNull();
    expect(firstResponseMinutes([{ status: null, at: null }])).toBeNull();
  });

  test("summarizes mean, sample size and slow responses", () => {
    expect(summarizeResponses([4, 12, null, 8])).toEqual({
      avgMinutes: 8,
      samples: 3,
      overThreshold: 1,
    });
    expect(summarizeResponses([])).toEqual({
      avgMinutes: null,
      samples: 0,
      overThreshold: 0,
    });
  });
});

describe("rescue timer formatting", () => {
  test("formats waits, codes and minutes", () => {
    expect(formatWait(75_000)).toBe("1:15");
    expect(formatWait(3_725_000)).toBe("1:02:05");
    expect(formatWait(-5)).toBe("0:00");
    expect(rescueCode("3f9a1c2d-0000-4000-8000-000000000000")).toBe(
      "CH-3F9A1C",
    );
    expect(formatMinutes(7.42)).toBe("7,4");
  });
});
