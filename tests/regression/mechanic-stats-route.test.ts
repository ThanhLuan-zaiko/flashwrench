import { describe, expect, mock, test } from "bun:test";

const daily = { weekRevenue: 1200000, previousWeekRevenue: 800000 };

mock.module("@/lib/auth/authorization", () => ({
  requireRole: async () => ({ response: null, user: { id: "mechanic-1" } }),
}));

mock.module("@/lib/mechanic/mechanic-stats.service", () => ({
  getMechanicStats: async () => ({
    ok: true,
    data: {
      stats: { openJobs: 1 },
      monthly: [],
      ratings: [],
      reviews: [],
      daily,
    },
  }),
}));

const { GET } = await import("@/app/api/mechanic/stats/route");

describe("GET /api/mechanic/stats", () => {
  // The performance page reads payload.daily.weekRevenue; a response that
  // dropped `daily` crashed the whole page with a TypeError.
  test("includes the daily block the performance page depends on", async () => {
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.daily).toEqual(daily);
  });
});
