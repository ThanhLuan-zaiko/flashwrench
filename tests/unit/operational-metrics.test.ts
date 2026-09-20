import { describe, expect, test } from "bun:test";
import { mechanicIncomeSnapshot } from "@/lib/mechanic/mechanic-income-metrics";
import { mechanicStatsSnapshot } from "@/lib/mechanic/mechanic-stats-metrics";
import {
  isMetricMonth,
  operationsSnapshot,
} from "@/lib/operations/operations-metrics";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  emptyRatingSnapshot,
  metricReceipt,
  metricRecord,
  sequentialMetricRecords,
} from "../helpers/metrics.fixtures";

const NOW = new Date("2026-09-16T10:00:00Z");

describe("authoritative operational metrics", () => {
  test("counts beyond old scan limits and sums actual receipts, not invoice totals", () => {
    const rows = sequentialMetricRecords(501);
    rows.push(rows[0]);
    const income = mechanicIncomeSnapshot(rows, NOW, { page: 2, pageSize: 8 });
    expect(income.summary).toMatchObject({
      lifetime: 100200,
      today: 100200,
      pendingTotal: 150300,
      paidCount: 501,
      pendingCount: 501,
    });
    expect(income.pagination).toEqual({
      page: 2,
      pageSize: 8,
      total: 501,
      totalPages: 63,
    });
    expect(income.entries).toHaveLength(8);
    expect(income.entries[0]).toMatchObject({
      total: 500,
      received: 200,
      outstanding: 300,
      state: "pending",
    });
    expect(income.truncated).toBe(false);
    const stats = mechanicStatsSnapshot(rows, emptyRatingSnapshot(), NOW);
    expect(stats.stats).toMatchObject({
      completedJobs: 501,
      completedThisMonth: 501,
      revenueTotal: 100200,
      revenueThisMonth: 100200,
    });
    const operations = operationsSnapshot(rows, "2026-09", NOW);
    expect(operations.totals).toMatchObject({
      bookings: 501,
      completed: 501,
      bookingValue: 250500,
      collected: 100200,
      outstanding: 150300,
      completionRate: 100,
    });
  });

  test("completion uses the timeline; revenue uses payment dates in Vietnam, never scheduled_at", () => {
    const record = metricRecord({
      booking: makeBookingRow({
        status: "completed",
        scheduled_at: new Date("2026-08-31T16:00:00Z"),
        month_bucket: "2026-08",
      }),
      completedAt: new Date("2026-08-31T18:00:00Z"),
      payments: [
        metricReceipt({
          paid_at: new Date("2026-10-01T00:00:00Z"),
          amount: 120000,
        }),
      ],
    });
    const now = new Date("2026-10-16T10:00:00Z");
    const stats = mechanicStatsSnapshot([record], emptyRatingSnapshot(), now);
    expect(
      stats.monthly.find((point) => point.month === "2026-08"),
    ).toMatchObject({ completed: 0, revenue: 0 });
    expect(
      stats.monthly.find((point) => point.month === "2026-09"),
    ).toMatchObject({ completed: 1, revenue: 0 });
    expect(
      stats.monthly.find((point) => point.month === "2026-10"),
    ).toMatchObject({ completed: 0, revenue: 120000 });
    expect(stats.stats.completedThisMonth).toBe(0);
    expect(mechanicIncomeSnapshot([record], now).summary.month).toBe(120000);
  });

  test("uses Monday local-time week boundaries and deduplicates receipts", () => {
    const first = metricReceipt({
      payment_id: "one",
      amount: 10,
      paid_at: new Date("2026-09-13T16:59:00Z"),
    });
    const record = metricRecord({
      payments: [
        first,
        first,
        metricReceipt({
          payment_id: "two",
          amount: 20,
          paid_at: new Date("2026-09-13T17:01:00Z"),
        }),
        metricReceipt({
          payment_id: "three",
          amount: 30,
          paid_at: new Date("2026-09-15T17:00:00Z"),
        }),
        metricReceipt({ payment_id: "four", amount: 999, status: "failed" }),
        metricReceipt({ payment_id: "five", amount: 888, status: "pending" }),
      ],
    });
    expect(mechanicIncomeSnapshot([record], NOW).summary).toMatchObject({
      lifetime: 60,
      month: 60,
      week: 50,
      today: 30,
      paidCount: 3,
    });
  });

  test("does not invent missing completion or payment dates", () => {
    const record = metricRecord({
      completedAt: null,
      payments: [
        metricReceipt({ payment_id: "one", amount: 100, paid_at: null }),
        metricReceipt({
          payment_id: "two",
          amount: 50,
          paid_at: new Date("2027-01-01T00:00:00Z"),
        }),
      ],
    });
    const stats = mechanicStatsSnapshot([record], emptyRatingSnapshot(), NOW);
    expect(stats.stats).toMatchObject({
      completedJobs: 1,
      completedThisMonth: 0,
      revenueTotal: 150,
      revenueThisMonth: 0,
    });
    expect(stats.scope).toMatchObject({
      undatedCompletions: 1,
      undatedPayments: 2,
    });
    expect(
      stats.monthly.every(
        (point) => point.completed === 0 && point.revenue === 0,
      ),
    ).toBe(true);
    const income = mechanicIncomeSnapshot([record], NOW);
    expect(income.summary).toMatchObject({
      lifetime: 150,
      today: 0,
      week: 0,
      month: 0,
    });
    expect(income.entries[0].stamp).toBeNull();
  });

  test("refunded receipts are not income or collectible debt", () => {
    const record = metricRecord({
      booking: makeBookingRow({
        status: "completed",
        payment_status: "refunded",
        month_bucket: "2026-09",
      }),
      payments: [metricReceipt({ status: "refunded" })],
    });
    const income = mechanicIncomeSnapshot([record], NOW);
    expect(income.summary).toMatchObject({
      lifetime: 0,
      pendingTotal: 0,
      pendingCount: 0,
    });
    expect(income.entries[0].state).toBe("refunded");
    expect(operationsSnapshot([record], "2026-09", NOW).totals).toMatchObject({
      collected: 0,
      outstanding: 0,
    });
  });

  test("operations is an explicit scheduled-month cohort, not calendar cashflow", () => {
    const record = metricRecord({
      payments: [
        metricReceipt({
          amount: 125000,
          paid_at: new Date("2026-08-01T12:00:00Z"),
        }),
      ],
    });
    const outside = metricRecord({
      booking: makeBookingRow({
        booking_id: "outside",
        month_bucket: "2026-08",
      }),
    });
    const result = operationsSnapshot(
      [record, outside, record],
      "2026-09",
      NOW,
    );
    expect(result.totals).toMatchObject({ bookings: 1, collected: 125000 });
    expect(result.scope).toMatchObject({
      kind: "scheduled-month",
      month: "2026-09",
      generatedAt: NOW.toISOString(),
    });
    expect(result.daily).toHaveLength(30);
    expect(
      result.daily.find((point) => point.day === "2026-09-16"),
    ).toMatchObject({ bookings: 1, completed: 1, value: 450000 });
  });

  test("unassigned open work differs from terminal cancellations and completion rate", () => {
    const records = [
      metricRecord({
        status: "pending",
        booking: makeBookingRow({
          booking_id: "one",
          status: "pending",
          mechanic_id: null,
          month_bucket: "2026-09",
        }),
      }),
      metricRecord({
        status: "cancelled",
        booking: makeBookingRow({
          booking_id: "two",
          status: "cancelled",
          mechanic_id: null,
          month_bucket: "2026-09",
        }),
      }),
      metricRecord(),
    ];
    expect(operationsSnapshot(records, "2026-09", NOW).totals).toMatchObject({
      bookings: 3,
      open: 1,
      unassigned: 1,
      completed: 1,
      cancelled: 1,
      completionRate: 50,
      bookingValue: 900000,
    });
  });

  test("filters before pagination, clamps after changes, and keeps global totals", () => {
    const records = sequentialMetricRecords(12);
    records[0].booking.payment_status = "refunded";
    records[0].payments[0].status = "refunded";
    const result = mechanicIncomeSnapshot(records, NOW, {
      state: "refunded",
      page: 8,
      pageSize: 8,
    });
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 8,
      total: 1,
      totalPages: 1,
    });
    expect(result.entries).toHaveLength(1);
    expect(result.counts).toEqual({
      all: 12,
      paid: 0,
      pending: 11,
      refunded: 1,
    });
    expect(result.summary.lifetime).toBe(2200);
  });

  test("empty data yields zero, never a seeded profile average", () => {
    const stats = mechanicStatsSnapshot([], emptyRatingSnapshot(), NOW);
    expect(stats.stats.ratingAvg).toBe(0);
    expect(stats.stats.ratingCount).toBe(0);
    expect(stats.stats.completionRate).toBe(0);
    expect(stats.monthly).toHaveLength(6);
    expect(operationsSnapshot([], "2028-02", NOW).daily).toHaveLength(29);
  });

  test("rejects invalid ranges, invalid money and unsafe sums", () => {
    expect(isMetricMonth("2026-13")).toBe(false);
    expect(isMetricMonth("../2026-09")).toBe(false);
    expect(() => operationsSnapshot([], "2026-13", NOW)).toThrow();
    expect(() => mechanicIncomeSnapshot([], NOW, { page: 0 })).toThrow();
    expect(() =>
      mechanicStatsSnapshot([], emptyRatingSnapshot(), NOW, 1, 51),
    ).toThrow();
    const invalid = metricRecord({
      payments: [metricReceipt({ amount: Number.NaN })],
    });
    expect(() => mechanicIncomeSnapshot([invalid], NOW)).toThrow();
    const overflow = metricRecord({
      payments: [
        metricReceipt({ payment_id: "a", amount: Number.MAX_SAFE_INTEGER }),
        metricReceipt({ payment_id: "b", amount: 1 }),
      ],
    });
    expect(() => mechanicIncomeSnapshot([overflow], NOW)).toThrow();
  });
});
