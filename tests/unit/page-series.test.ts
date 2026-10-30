// Pure builders behind the one-chart-per-page staff screens, plus the
// order-trend aggregation and zone-load ordering. No I/O, no mocks.
import { describe, expect, test } from "bun:test";
import { buildOrderTrend, trendMonthBuckets } from "@/lib/orders/orders-trend";
import {
  campaignUsage,
  groupTotals,
  lowestStock,
  receivedByDay,
  shortDay,
  upcomingLoad,
} from "@/lib/staff-charts/page-series";
import { sortZoneLoad } from "@/lib/zones/zone-load.service";

const NOW = new Date("2026-09-15T10:00:00+07:00");

describe("groupTotals", () => {
  test("counts or sums per key, largest first", () => {
    const rows = [
      { k: "a", n: 2 },
      { k: "b", n: 5 },
      { k: "a", n: 4 },
    ];
    expect(
      groupTotals(
        rows,
        (r) => r.k,
        (r) => r.k.toUpperCase(),
      ),
    ).toEqual([
      { key: "a", label: "A", value: 2 },
      { key: "b", label: "B", value: 1 },
    ]);
    expect(
      groupTotals(
        rows,
        (r) => r.k,
        (r) => r.k,
        (r) => r.n,
      ).map((g) => g.value),
    ).toEqual([6, 5]);
    expect(
      groupTotals(
        [],
        () => "x",
        () => "x",
      ),
    ).toEqual([]);
  });
});

describe("lowestStock and campaignUsage", () => {
  test("lowest active stock first, inactive parts skipped", () => {
    const parts = [
      { id: "1", name: "Lốp", stockQty: 9, isActive: true },
      { id: "2", name: "Bugi", stockQty: 0, isActive: true },
      { id: "3", name: "Ẩn", stockQty: -1, isActive: false },
    ];
    expect(lowestStock(parts, 2).map((row) => row.key)).toEqual(["2", "1"]);
  });

  test("usage ratio caps at 1 and ignores paused or deleted campaigns", () => {
    const base = { isActive: true, isDeleted: false };
    const usage = campaignUsage([
      { ...base, id: "a", name: "A", grantedCount: 30, totalLimit: 20 },
      { ...base, id: "b", name: "B", grantedCount: 5, totalLimit: 0 },
      {
        ...base,
        id: "c",
        name: "C",
        grantedCount: 99,
        totalLimit: 100,
        isActive: false,
      },
      {
        ...base,
        id: "d",
        name: "D",
        grantedCount: 99,
        totalLimit: 100,
        isDeleted: true,
      },
    ]);
    expect(usage.map((row) => [row.key, row.ratio])).toEqual([
      ["a", 1],
      ["b", 0],
    ]);
  });
});

describe("day series", () => {
  test("upcomingLoad counts today and the next six days, skipping cancelled", () => {
    const load = upcomingLoad(
      [
        { scheduledAt: "2026-09-15T09:00:00+07:00", status: "confirmed" },
        { scheduledAt: "2026-09-21T09:00:00+07:00", status: "pending" },
        { scheduledAt: "2026-09-16T09:00:00+07:00", status: "cancelled" },
        { scheduledAt: "2026-09-22T09:00:00+07:00", status: "pending" },
        { scheduledAt: null, status: "pending" },
      ],
      NOW,
    );
    expect(load[0]).toEqual({ day: "2026-09-15", value: 1 });
    expect(load[6]).toEqual({ day: "2026-09-21", value: 1 });
    expect(load.reduce((sum, p) => sum + p.value, 0)).toBe(2);
  });

  test("receivedByDay sums received money in the last 30 days", () => {
    const days = receivedByDay(
      [
        { stamp: "2026-09-15T08:00:00+07:00", received: 200_000 },
        { stamp: "2026-09-15T09:00:00+07:00", received: 50_000 },
        { stamp: "2026-09-14T09:00:00+07:00", received: 0 },
        { stamp: "2026-07-01T09:00:00+07:00", received: 900_000 },
      ],
      NOW,
    );
    expect(days).toHaveLength(30);
    expect(days.at(-1)).toEqual({ day: "2026-09-15", value: 250_000 });
    expect(days.reduce((sum, p) => sum + p.value, 0)).toBe(250_000);
    expect(shortDay("2026-09-05")).toBe("5/9");
  });
});

describe("order trend", () => {
  test("counts every order but values only non-void ones", () => {
    const at = (iso: string) => new Date(iso);
    const points = buildOrderTrend(
      [
        {
          status: "delivered",
          rows: [
            { created_at: at("2026-09-15T08:00:00+07:00"), total: 400_000 },
          ],
        },
        {
          status: "cancelled",
          rows: [
            { created_at: at("2026-09-15T09:00:00+07:00"), total: 900_000 },
          ],
        },
        { status: "pending", rows: [{ created_at: null, total: 1 }] },
      ],
      NOW,
    );
    expect(points).toHaveLength(14);
    expect(points.at(-1)).toEqual({
      day: "2026-09-15",
      count: 2,
      value: 400_000,
    });
  });

  test("reads the previous month when the window crosses it", () => {
    expect(trendMonthBuckets(new Date("2026-10-05T10:00:00+07:00"))).toEqual([
      "2026-10",
      "2026-09",
    ]);
    expect(trendMonthBuckets(NOW)).toEqual(["2026-09"]);
  });
});

describe("sortZoneLoad", () => {
  test("busiest zone first, ties by name", () => {
    const zone = (name: string, waiting: number, active: number) => ({
      zoneId: name,
      name,
      isActive: true,
      waiting,
      active,
    });
    expect(
      sortZoneLoad([
        zone("Q7", 1, 0),
        zone("Q1", 0, 3),
        zone("Bình Thạnh", 1, 0),
      ]).map((z) => z.name),
    ).toEqual(["Q1", "Bình Thạnh", "Q7"]);
  });
});
