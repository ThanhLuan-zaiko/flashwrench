import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  MECHANIC_ID,
  makeProfileRow,
  makeReviewRow,
  makeWorkloadRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  mechanicWorkspaceRepoMocks,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, matching tests/integration/*.test.ts.
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module(
  "@/lib/mechanic/mechanic-workspace.repository",
  () => mechanicWorkspaceRepoMocks,
);

import { getMechanicStats } from "@/lib/mechanic/mechanic-stats.service";

const REFERENCE = new Date("2026-09-16T10:00:00.000Z");

beforeEach(() => {
  resetMechanicMocks();
});

describe("getMechanicStats", () => {
  test("counts jobs, revenue, monthly series and review ratings", async () => {
    mechanicStubs.workloadRows = [
      makeWorkloadRow({ status: "completed" }),
      makeWorkloadRow({
        booking_id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        status: "completed",
        scheduled_at: new Date("2026-08-10T07:00:00.000Z"),
        total: 520000,
      }),
      makeWorkloadRow({
        booking_id: "cccccccc-3333-4333-8333-cccccccccccc",
        status: "pending",
      }),
      makeWorkloadRow({
        booking_id: "dddddddd-4444-4444-8444-dddddddddddd",
        status: "cancelled",
      }),
      makeWorkloadRow({
        booking_id: "eeeeeeee-5555-4555-8555-eeeeeeeeeeee",
        status: "no_show",
      }),
      // Unknown statuses never leak into the numbers.
      makeWorkloadRow({
        booking_id: "ffffffff-6666-4666-8666-ffffffffffff",
        status: "shipped",
      }),
    ];
    mechanicStubs.profile = makeProfileRow();
    mechanicStubs.reviewRows = [
      makeReviewRow({ rating: 5 }),
      makeReviewRow({
        review_id: "66666666-6666-4666-8666-666666666666",
        customer_name: "Tran Thi Binh",
        rating: 4,
        title: "",
        body: "On som.",
        created_at: new Date("2026-09-15T10:00:00.000Z"),
      }),
      makeReviewRow({
        review_id: "77777777-7777-4777-8777-777777777777",
        customer_name: "Le Van Cuong",
        rating: 9,
        title: "Ke",
        body: "Ke.",
        created_at: new Date("2026-09-14T10:00:00.000Z"),
      }),
    ];

    const result = await getMechanicStats(MECHANIC_ID, { now: REFERENCE });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.stats).toMatchObject({
      openJobs: 1,
      completedJobs: 2,
      cancelledJobs: 1,
      noShowJobs: 1,
      completedThisMonth: 1,
      revenueTotal: 970000,
      revenueThisMonth: 450000,
      ratingAvg: 4.5,
      ratingCount: 2,
      completionRate: 50,
    });
    expect(result.data.monthly.map((point) => point.month)).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    const august = result.data.monthly.find(
      (point) => point.month === "2026-08",
    );
    expect(august).toMatchObject({ completed: 1, revenue: 520000 });
    expect(
      result.data.ratings.find((bucket) => bucket.stars === 5),
    ).toMatchObject({ count: 1 });
    expect(result.data.reviews).toHaveLength(3);
    expect(result.data.reviews[0]).toMatchObject({
      customerName: "Nguyen Van An",
      rating: 5,
      comment: "Lam rat tot — Tho den dung gio, sua nhanh.",
    });
  });

  test("survives a missing profile and a silent review table", async () => {
    mechanicStubs.workloadRows = [];
    mechanicStubs.profile = null;
    mechanicStubs.reviewRows = [];

    const result = await getMechanicStats(MECHANIC_ID, { now: REFERENCE });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.stats).toMatchObject({
      openJobs: 0,
      completedJobs: 0,
      ratingAvg: 0,
      ratingCount: 0,
      completionRate: 0,
    });
    expect(result.data.monthly).toHaveLength(6);
    expect(result.data.reviews).toEqual([]);
  });
});
