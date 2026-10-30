import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";

type TrendRow = { created_at: Date | null; total: number | null };

const stubs = {
  trend: new Map<string, TrendRow[]>(),
  pageState: null as string | null,
  zones: [] as Array<{
    zone_id: string;
    name: string | null;
    is_active: boolean | null;
  }>,
  zoneCounts: new Map<string, number>(),
};

const trendRepoMocks = {
  listOrderTrendRows: mock(async (status: string, month: string) => ({
    rows: stubs.trend.get(`${status}|${month}`) ?? [],
    pageState: stubs.pageState,
  })),
};
const zoneRepoMocks = {
  listServiceZones: mock(async () => stubs.zones),
};
const zoneLoadRepoMocks = {
  countZoneRescues: mock(
    async (zoneId: string, status: string) =>
      stubs.zoneCounts.get(`${zoneId}|${status}`) ?? 0,
  ),
};

mock.module("@/lib/orders/orders-trend.repository", () => trendRepoMocks);
mock.module("@/lib/zones/zone.repository", () => zoneRepoMocks);
mock.module("@/lib/zones/zone-load.repository", () => zoneLoadRepoMocks);

import { getOrderTrend } from "@/lib/orders/orders-trend.service";
import { getZoneLoad } from "@/lib/zones/zone-load.service";

const NOW = new Date("2026-09-15T10:00:00+07:00");

beforeEach(() => {
  stubs.trend = new Map();
  stubs.pageState = null;
  stubs.zones = [];
  stubs.zoneCounts = new Map();
  trendRepoMocks.listOrderTrendRows.mockClear();
  zoneRepoMocks.listServiceZones.mockClear();
  zoneLoadRepoMocks.countZoneRescues.mockClear();
});

describe("getOrderTrend", () => {
  test("rejects customers and mechanics without reading orders", async () => {
    for (const role of ["customer", "mechanic"] as const) {
      const result = await getOrderTrend(makePublicUser({ role }), NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    }
    expect(trendRepoMocks.listOrderTrendRows).not.toHaveBeenCalled();
  });

  test("aggregates 14 days across every status for dispatchers and admins", async () => {
    stubs.trend.set("pending|2026-09", [
      { created_at: new Date("2026-09-15T08:00:00+07:00"), total: 300_000 },
    ]);
    stubs.trend.set("delivered|2026-09", [
      { created_at: new Date("2026-09-10T08:00:00+07:00"), total: 200_000 },
    ]);
    for (const role of ["dispatcher", "admin"] as const) {
      const result = await getOrderTrend(makePublicUser({ role }), NOW);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.data.points).toHaveLength(14);
      expect(result.data.points.at(-1)).toEqual({
        day: "2026-09-15",
        count: 1,
        value: 300_000,
      });
      expect(result.data.points.reduce((s, p) => s + p.value, 0)).toBe(500_000);
      expect(result.data.truncated).toBe(false);
    }
  });

  test("flags partial data when a partition hits the cap", async () => {
    stubs.pageState = "more";
    const result = await getOrderTrend(makePublicUser({ role: "admin" }), NOW);
    expect(result.ok && result.data.truncated).toBe(true);
  });
});

describe("getZoneLoad", () => {
  test("is admin only and never counts for other roles", async () => {
    const result = await getZoneLoad(makePublicUser({ role: "dispatcher" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
    expect(zoneRepoMocks.listServiceZones).not.toHaveBeenCalled();
  });

  test("sums waiting and active rescues per zone, busiest first", async () => {
    stubs.zones = [
      { zone_id: "z1", name: "Quận 7", is_active: true },
      { zone_id: "z2", name: null, is_active: false },
    ];
    stubs.zoneCounts.set("z1|open", 1);
    stubs.zoneCounts.set("z2|dispatched", 2);
    stubs.zoneCounts.set("z2|arrived", 1);
    const result = await getZoneLoad(makePublicUser({ role: "admin" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toEqual([
      {
        zoneId: "z2",
        name: "Vùng chưa đặt tên",
        isActive: false,
        waiting: 2,
        active: 1,
      },
      { zoneId: "z1", name: "Quận 7", isActive: true, waiting: 1, active: 0 },
    ]);
  });
});
