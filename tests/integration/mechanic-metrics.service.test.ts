import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { MechanicBookingRow } from "@/lib/mechanic/mechanic.types";
import type { BookingMetric } from "@/lib/operations/metrics.types";
import { emptyRatingSnapshot, sequentialMetricRecords } from "../helpers/metrics.fixtures";
import { MECHANIC_ID, makeBookingRow, makeReviewRow } from "../helpers/mechanic.fixtures";
import { mechanicBookingsRepoMocks, resetMechanicMocks } from "../helpers/mechanic.mocks";

const stub = { records: [] as BookingMetric[], bookings: [] as MechanicBookingRow[], ratings: emptyRatingSnapshot() };
const captures = {
  captureMechanicMetrics: mock(async (_id: string) => stub.records),
  captureMechanicBookingRows: mock(async (_id: string) => stub.bookings),
  captureMechanicRatings: mock(async (_id: string) => stub.ratings),
};
mock.module("@/lib/operations/metric-capture.service", () => captures);
mock.module("@/lib/mechanic/mechanic-bookings.repository", () => mechanicBookingsRepoMocks);

import { getMechanicIncomeMetrics, getMechanicStatsMetrics, getPublicMechanicMetrics } from "@/lib/mechanic/mechanic-metrics.service";
import { getMechanicSchedule } from "@/lib/mechanic/mechanic-schedule.service";

beforeEach(() => {
  resetMechanicMocks();
  stub.records = [];
  stub.bookings = [];
  stub.ratings = emptyRatingSnapshot();
  for (const fn of Object.values(captures)) fn.mockClear();
});

const NOW = new Date("2026-09-16T10:00:00Z");

describe("mechanic snapshot services", () => {
  test("validates income paging and states before reading metric sources", async () => {
    for (const params of [{ page: 0 }, { page: 1.1 }, { limit: 51 }, { limit: Number.NaN }, { state: "other" }]) {
      expect(await getMechanicIncomeMetrics(MECHANIC_ID, params)).toMatchObject({ ok: false, status: 400 });
    }
    expect(captures.captureMechanicMetrics).not.toHaveBeenCalled();
  });

  test("income preserves full summaries while returning a bounded second page", async () => {
    stub.records = sequentialMetricRecords(65);
    const result = await getMechanicIncomeMetrics(MECHANIC_ID, { page: 2, limit: 8, state: "pending", now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.summary.lifetime).toBe(13000);
    expect(result.data.summary.pendingTotal).toBe(19500);
    expect(result.data.pagination).toEqual({ page: 2, pageSize: 8, total: 65, totalPages: 9 });
    expect(result.data.entries).toHaveLength(8);
    expect(captures.captureMechanicMetrics.mock.calls).toEqual([[MECHANIC_ID]]);
  });

  test("review pagination leaves full rating totals unchanged", async () => {
    const reviews = Array.from({ length: 12 }, (_, index) => makeReviewRow({ review_id: `r-${index}` }));
    stub.ratings = { average: 5, count: 12, distribution: [{ stars: 5, count: 12 }], reviews };
    const result = await getMechanicStatsMetrics(MECHANIC_ID, { reviewPage: 3, now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.stats).toMatchObject({ ratingAvg: 5, ratingCount: 12 });
    expect(result.data.reviews.map((review) => review.id)).toEqual(["r-10", "r-11"]);
    expect(result.data.reviewPagination).toEqual({ page: 3, pageSize: 5, total: 12, totalPages: 3 });
    expect(await getMechanicStatsMetrics(MECHANIC_ID, { reviewPage: -1 })).toMatchObject({ ok: false, status: 400 });
  });

  test("public ratings and completions come from captured rows, not mutable profile counters", async () => {
    stub.bookings = [makeBookingRow({ status: "completed" }), makeBookingRow({ status: "cancelled" }), makeBookingRow({ status: "in_progress" })];
    stub.ratings = { ...emptyRatingSnapshot(), count: 60, average: 4.3 };
    expect(await getPublicMechanicMetrics(MECHANIC_ID)).toEqual({ ratingAvg: 4.3, ratingCount: 60, completedJobs: 1 });
    expect(captures.captureMechanicBookingRows.mock.calls).toEqual([[MECHANIC_ID]]);
  });
});

describe("complete mechanic schedule", () => {
  test("keeps older open work beyond sixty recent completions and counts before filtering", async () => {
    stub.bookings = Array.from({ length: 61 }, (_, index) => makeBookingRow({ booking_id: `done-${index}`, status: "completed", scheduled_at: new Date("2026-09-16T08:00:00Z") }));
    stub.bookings.push(makeBookingRow({ booking_id: "older-open", status: "en_route", scheduled_at: new Date("2026-09-15T08:00:00Z") }));
    const result = await getMechanicSchedule(MECHANIC_ID, { status: "en_route", now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.bookings.map((booking) => booking.id)).toEqual(["older-open"]);
    expect(result.data.counts).toMatchObject({ all: 62, completed: 61, en_route: 1 });
    expect(result.data.overview).toEqual({ today: 61, completed: 61, open: 1, pending: 0 });
    expect(result.data.pagination.total).toBe(1);
  });

  test("clamps out-of-range pages and loads item snapshots only for displayed rows", async () => {
    stub.bookings = Array.from({ length: 10 }, (_, index) => makeBookingRow({ booking_id: `id-${index}` }));
    const result = await getMechanicSchedule(MECHANIC_ID, { page: 999, limit: 8, now: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.pagination).toEqual({ page: 2, pageSize: 8, total: 10, totalPages: 2 });
    expect(result.data.bookings.map((booking) => booking.id)).toEqual(["id-8", "id-9"]);
    expect(mechanicBookingsRepoMocks.listBookingItemRowsByBookingIds.mock.calls).toEqual([[["id-8", "id-9"]]]);
  });

  test("rejects unknown filter or invalid page before storage", async () => {
    expect(await getMechanicSchedule(MECHANIC_ID, { status: "unknown" })).toMatchObject({ ok: false, status: 400 });
    expect(await getMechanicSchedule(MECHANIC_ID, { page: -1 })).toMatchObject({ ok: false, status: 400 });
    expect(captures.captureMechanicBookingRows).not.toHaveBeenCalled();
  });
});
