import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";

type RefRow = { booking_id: string; scheduled_at: Date | null };

// Status partition → month bucket → rows, plus rescue status counts.
const stubs = {
  refs: new Map<string, RefRow[]>(),
  pageState: null as string | null,
  rescueCounts: new Map<string, number>(),
  history: new Map<string, Array<{ status: string | null; at: Date | null }>>(),
  openRescues: [] as Array<{
    request_id: string;
    status: string;
    created_at: Date | null;
    issue_type: string | null;
    priority: string | null;
  }>,
  revenueOk: true,
};

const dispatchRepoMocks = {
  listStatusBookingRefs: mock(async (status: string, month: string) => ({
    rows: stubs.refs.get(`${status}|${month}`) ?? [],
    pageState: stubs.pageState,
  })),
};
const adminDashboardRepoMocks = {
  countRescueRefsByStatus: mock(
    async (status: string) => stubs.rescueCounts.get(status) ?? 0,
  ),
};

const pulseRepoMocks = {
  listOpenRescueRows: mock(async (status: string) =>
    stubs.openRescues.filter((row) => row.status === status),
  ),
};
const metricsRepoMocks = {
  metricHistoryPage: mock(async (bookingId: string) => ({
    rows: stubs.history.get(bookingId) ?? [],
    pageState: null,
  })),
};
const revenueServiceMocks = {
  getDispatchRevenue: mock(async () =>
    stubs.revenueOk
      ? {
          ok: true,
          data: {
            collected: 900_000,
            previous: { collected: 600_000, delta: 300_000, percent: 50 },
            series: [
              { key: "08", label: "8h", amount: 400_000, count: 1 },
              { key: "09", label: "9h", amount: 500_000, count: 1 },
            ],
          },
        }
      : { ok: false, status: 500, errors: { form: "x" } },
  ),
};

mock.module("@/lib/dispatch/dispatch.repository", () => dispatchRepoMocks);
mock.module("@/lib/dispatch/dispatch-pulse.repository", () => pulseRepoMocks);
mock.module("@/lib/operations/metrics.repository", () => metricsRepoMocks);
mock.module("@/lib/revenue/revenue.service", () => revenueServiceMocks);
mock.module(
  "@/lib/admin/admin-dashboard.repository",
  () => adminDashboardRepoMocks,
);

import { getDispatchPulse } from "@/lib/dispatch/dispatch-pulse.service";

const dispatcher = makePublicUser({ role: "dispatcher" });
const ref = (id: string, iso: string): RefRow => ({
  booking_id: id,
  scheduled_at: new Date(iso),
});

beforeEach(() => {
  stubs.refs = new Map();
  stubs.pageState = null;
  stubs.rescueCounts = new Map();
  stubs.history = new Map();
  stubs.openRescues = [];
  stubs.revenueOk = true;
  metricsRepoMocks.metricHistoryPage.mockClear();
  dispatchRepoMocks.listStatusBookingRefs.mockClear();
  adminDashboardRepoMocks.countRescueRefsByStatus.mockClear();
});

describe("getDispatchPulse", () => {
  test("rejects customers and mechanics without touching storage", async () => {
    for (const role of ["customer", "mechanic"] as const) {
      const result = await getDispatchPulse(makePublicUser({ role }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    }
    expect(dispatchRepoMocks.listStatusBookingRefs).not.toHaveBeenCalled();
    expect(
      adminDashboardRepoMocks.countRescueRefsByStatus,
    ).not.toHaveBeenCalled();
  });

  test("aggregates hourly load, funnel, rate and rescues", async () => {
    const now = new Date("2026-09-15T10:30:00+07:00");
    stubs.refs.set("pending|2026-09", [
      ref("a", "2026-09-15T09:10:00+07:00"),
      ref("b", "2026-09-14T09:40:00+07:00"),
    ]);
    stubs.refs.set("completed|2026-09", [
      ref("c", "2026-09-15T08:00:00+07:00"),
    ]);
    stubs.refs.set("cancelled|2026-09", [
      ref("d", "2026-09-15T08:00:00+07:00"),
    ]);
    stubs.rescueCounts.set("open", 2);
    stubs.rescueCounts.set("arrived", 1);

    const result = await getDispatchPulse(dispatcher, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const pulse = result.data;
    expect(pulse.day).toBe("2026-09-15");
    expect(pulse.currentHour).toBe(10);
    expect(pulse.today).toHaveLength(11);
    expect(pulse.todayTotal).toBe(2);
    expect(pulse.yesterdayTotal).toBe(1);
    expect(pulse.funnel.find((s) => s.stage === "waiting")?.count).toBe(1);
    expect(pulse.cancelledToday).toBe(1);
    expect(pulse.completionRate).toBeCloseTo(0.5);
    expect(pulse.rescues.map((s) => s.count)).toEqual([2, 0, 1]);
    expect(pulse.truncated).toBe(false);
  });

  test("reads the previous month bucket on the first day of a month", async () => {
    const now = new Date("2026-10-01T07:00:00+07:00");
    stubs.refs.set("pending|2026-09", [ref("y", "2026-09-30T20:00:00+07:00")]);

    const result = await getDispatchPulse(dispatcher, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const months = new Set(
      dispatchRepoMocks.listStatusBookingRefs.mock.calls.map((call) => call[1]),
    );
    expect(months).toEqual(new Set(["2026-10", "2026-09"]));
    expect(result.data.yesterday[20]).toBe(1);
  });

  test("flags partial data when a partition hits the page cap", async () => {
    stubs.pageState = "more";
    const result = await getDispatchPulse(
      dispatcher,
      new Date("2026-09-15T10:00:00+07:00"),
    );
    expect(result.ok && result.data.truncated).toBe(true);
  });

  test("computes first-response time from today's handled bookings", async () => {
    const now = new Date("2026-09-15T10:30:00+07:00");
    const at = (iso: string) => new Date(iso);
    stubs.refs.set("confirmed|2026-09", [
      ref("fast", "2026-09-15T09:00:00+07:00"),
    ]);
    stubs.refs.set("completed|2026-09", [
      ref("slow", "2026-09-15T08:00:00+07:00"),
    ]);
    stubs.refs.set("pending|2026-09", [
      ref("new", "2026-09-15T10:00:00+07:00"),
    ]);
    stubs.history.set("fast", [
      { status: "pending", at: at("2026-09-15T07:00:00+07:00") },
      { status: "confirmed", at: at("2026-09-15T07:04:00+07:00") },
    ]);
    stubs.history.set("slow", [
      { status: "pending", at: at("2026-09-15T06:00:00+07:00") },
      { status: "confirmed", at: at("2026-09-15T06:16:00+07:00") },
      { status: "completed", at: at("2026-09-15T09:00:00+07:00") },
    ]);

    const result = await getDispatchPulse(dispatcher, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.response).toEqual({
      avgMinutes: 10,
      samples: 2,
      overThreshold: 1,
      thresholdMinutes: 10,
    });
    // Pending bookings have no response yet and are never read.
    const read = metricsRepoMocks.metricHistoryPage.mock.calls.map((c) => c[0]);
    expect(read).not.toContain("new");
    expect(result.data.revenue).toEqual({
      collected: 900_000,
      percent: 50,
      series: [400_000, 500_000],
    });
  });

  test("lists open rescues oldest first with their stage", async () => {
    stubs.openRescues = [
      {
        request_id: "r-new",
        status: "open",
        created_at: new Date("2026-09-15T03:20:00Z"),
        issue_type: "flat_tire",
        priority: "normal",
      },
      {
        request_id: "r-old",
        status: "arrived",
        created_at: new Date("2026-09-15T02:00:00Z"),
        issue_type: "accident",
        priority: "high",
      },
      {
        request_id: "r-bad",
        status: "open",
        created_at: null,
        issue_type: null,
        priority: null,
      },
    ];
    const result = await getDispatchPulse(
      dispatcher,
      new Date("2026-09-15T10:30:00+07:00"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.openRescues.map((r) => [r.requestId, r.stage])).toEqual([
      ["r-old", "onsite"],
      ["r-new", "waiting"],
    ]);
    expect(result.data.openRescues[0]?.createdAt).toBe(
      "2026-09-15T02:00:00.000Z",
    );
  });

  test("keeps the pulse when the revenue report fails", async () => {
    stubs.revenueOk = false;
    const result = await getDispatchPulse(
      dispatcher,
      new Date("2026-09-15T10:30:00+07:00"),
    );
    expect(result.ok && result.data.revenue).toBeNull();
  });
});
