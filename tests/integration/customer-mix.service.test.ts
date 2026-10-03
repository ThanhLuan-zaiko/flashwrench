import { beforeEach, describe, expect, mock, test } from "bun:test";

// Customer-mix service suite: the service aggregates mocked counter and
// actor rows, and rejects bad ranges without touching storage. The
// repository is stubbed; range math and aggregation run for real.
const incrementMixCount = mock(async (_day: string, _k: string, _c: string) => {
  incrementCalls.push([_day, _k, _c]);
});
const incrementCalls: Array<[string, string, string]> = [];
const insertMixActor = mock(
  async (_day: string, _k: string, _c: string, _a: string) => {
    actorCalls.push([_day, _k, _c, _a]);
  },
);
const actorCalls: Array<[string, string, string, string]> = [];
const readMixCounts = mock(async (days: string[]) => {
  readCalls.push(days);
  return cannedRows.filter((row) => days.includes(row.day));
});
const readMixActors = mock(async (days: string[]) => {
  return cannedActors.filter((row) => days.includes(row.day));
});
const readCalls: string[][] = [];
const cannedRows = [
  { day: "2026-09-30", kind: "booking", channel: "member", total: 2 },
  { day: "2026-09-30", kind: "order", channel: "guest", total: 3 },
  { day: "2026-09-30", kind: "login", channel: "member", total: 4 },
  { day: "2026-09-30", kind: "signup", channel: "member", total: 1 },
];
const cannedActors = [
  { day: "2026-09-29", kind: "login", channel: "member", actor: "u:ann" },
  { day: "2026-09-30", kind: "login", channel: "member", actor: "u:ann" },
  { day: "2026-09-30", kind: "login", channel: "member", actor: "u:bob" },
  { day: "2026-09-30", kind: "login", channel: "guest", actor: "e:a@x.vn" },
  { day: "2026-09-30", kind: "booking", channel: "member", actor: "u:ann" },
  { day: "2026-09-30", kind: "order", channel: "guest", actor: "e:a@x.vn" },
  { day: "2026-09-30", kind: "signup", channel: "member", actor: "u:new" },
];

mock.module("@/lib/customer-mix/customer-mix.repository", () => ({
  incrementMixCount,
  insertMixActor,
  readMixActors,
  readMixCounts,
}));

import {
  getAdminCustomerMix,
  getDispatchCustomerMix,
  recordMixEvent,
} from "@/lib/customer-mix/customer-mix.service";

beforeEach(() => {
  incrementCalls.length = 0;
  actorCalls.length = 0;
  readCalls.length = 0;
  incrementMixCount.mockClear();
  insertMixActor.mockClear();
  readMixCounts.mockClear();
  readMixActors.mockClear();
});

describe("getAdminCustomerMix", () => {
  test("aggregates one day into member and guest totals", async () => {
    const result = await getAdminCustomerMix({
      range: "day",
      anchor: "2026-09-30",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.totals.memberOrders).toBe(2);
    expect(result.data.totals.guestOrders).toBe(3);
    expect(result.data.totals.memberLogins).toBe(4);
    expect(result.data.totals.memberSignups).toBe(1);
    expect(result.data.orderSeries).toHaveLength(1);
  });

  test("reports unique actors deduped across the range", async () => {
    const result = await getAdminCustomerMix({
      range: "week",
      anchor: "2026-09-30",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // u:ann logged in on two days but stays one customer in the week.
    expect(result.data.totals.memberLoginActors).toBe(2);
    expect(result.data.totals.guestLoginActors).toBe(1);
    // u:ann's booking + u:new's signup: only the booking counts as a buy.
    expect(result.data.totals.memberBuyers).toBe(1);
    expect(result.data.totals.guestBuyers).toBe(1);
  });

  test("rejects an unknown range without reading storage", async () => {
    const result = await getAdminCustomerMix({
      range: "year",
      anchor: "2026-09-30",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(readMixCounts).not.toHaveBeenCalled();
  });

  test("rejects a malformed anchor without reading storage", async () => {
    const result = await getDispatchCustomerMix({
      range: "week",
      anchor: "not-a-date",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(readMixCounts).not.toHaveBeenCalled();
  });

  test("dispatch reads the same counters over seven buckets", async () => {
    const result = await getDispatchCustomerMix({
      range: "week",
      anchor: "2026-09-30",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.orderSeries).toHaveLength(7);
    expect(readCalls[0]).toHaveLength(7);
  });
});

describe("recordMixEvent", () => {
  test("forwards day, kind and channel to the repository", async () => {
    await recordMixEvent("rescue", "guest", {
      at: new Date("2026-09-30T10:00:00+07:00"),
    });
    expect(incrementCalls).toEqual([["2026-09-30", "rescue", "guest"]]);
    expect(actorCalls).toEqual([]);
  });

  test("writes the actor ledger with the channel prefix", async () => {
    await recordMixEvent("login", "member", {
      at: new Date("2026-09-30T10:00:00+07:00"),
      actor: "user-1",
    });
    await recordMixEvent("login", "guest", {
      at: new Date("2026-09-30T10:00:00+07:00"),
      actor: "a@x.vn",
    });
    expect(actorCalls).toEqual([
      ["2026-09-30", "login", "member", "u:user-1"],
      ["2026-09-30", "login", "guest", "e:a@x.vn"],
    ]);
  });

  test("swallows repository failures so callers never break", async () => {
    incrementMixCount.mockRejectedValueOnce(new Error("scylla down"));
    insertMixActor.mockRejectedValueOnce(new Error("scylla down"));
    await expect(
      recordMixEvent("login", "member", { actor: "user-1" }),
    ).resolves.toBeUndefined();
  });
});
