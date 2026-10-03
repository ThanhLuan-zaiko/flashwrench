// Pure aggregation for the member-vs-guest report. No mocks, no I/O.
import { describe, expect, test } from "bun:test";
import { buildCustomerMixReport } from "@/lib/customer-mix/customer-mix.service";
import type {
  MixActorRow,
  MixCounterRow,
} from "@/lib/customer-mix/customer-mix.types";
import { isMixRange } from "@/lib/customer-mix/customer-mix.types";

function row(
  day: string,
  kind: string,
  channel: string,
  total: number,
): MixCounterRow {
  return { day, kind, channel, total };
}

function actor(
  day: string,
  kind: string,
  channel: string,
  who: string,
): MixActorRow {
  return { day, kind, channel, actor: who };
}

describe("isMixRange", () => {
  test("accepts day, week and month only", () => {
    expect(isMixRange("day")).toBe(true);
    expect(isMixRange("week")).toBe(true);
    expect(isMixRange("month")).toBe(true);
  });

  test("rejects revenue-only ranges and garbage", () => {
    for (const value of ["year", "all", "", null, undefined, 42]) {
      expect(isMixRange(value)).toBe(false);
    }
  });
});

describe("buildCustomerMixReport", () => {
  const days = ["2026-09-28", "2026-09-29"];
  const rows = [
    row("2026-09-28", "booking", "member", 3),
    row("2026-09-28", "booking", "guest", 2),
    row("2026-09-28", "order", "guest", 4),
    row("2026-09-29", "rescue", "member", 1),
    row("2026-09-29", "login", "member", 5),
    row("2026-09-29", "login", "guest", 7),
    row("2026-09-29", "signup", "member", 2),
  ];

  test("splits orders and logins by channel", () => {
    const report = buildCustomerMixReport("day", "2026-09-28", days, rows);
    expect(report.totals.memberOrders).toBe(4);
    expect(report.totals.guestOrders).toBe(6);
    expect(report.totals.memberLogins).toBe(5);
    expect(report.totals.guestLogins).toBe(7);
    expect(report.totals.memberShare).toBeCloseTo(0.4);
  });

  test("counts signups apart from logins and orders", () => {
    const report = buildCustomerMixReport("day", "2026-09-28", days, rows);
    expect(report.totals.memberSignups).toBe(2);
    expect(report.totals.memberLogins).toBe(5);
    expect(report.totals.memberOrders).toBe(4);
  });

  test("breaks orders down by kind", () => {
    const report = buildCustomerMixReport("day", "2026-09-28", days, rows);
    expect(report.byKind).toEqual([
      { kind: "booking", member: 3, guest: 2 },
      { kind: "order", member: 0, guest: 4 },
      { kind: "rescue", member: 1, guest: 0 },
    ]);
  });

  test("ignores unknown kinds and channels", () => {
    const report = buildCustomerMixReport("day", "2026-09-28", days, [
      ...rows,
      row("2026-09-28", "refund", "member", 100),
      row("2026-09-28", "booking", "staff", 100),
    ]);
    expect(report.totals.memberOrders).toBe(4);
    expect(report.totals.guestOrders).toBe(6);
    expect(report.totals.memberSignups).toBe(2);
  });

  test("reports a null share on an empty range", () => {
    const report = buildCustomerMixReport("day", "2026-09-28", days, []);
    expect(report.totals.memberShare).toBeNull();
    expect(report.orderSeries).toHaveLength(1);
    expect(report.loginSeries).toHaveLength(1);
  });

  test("covers every day of a week", () => {
    const report = buildCustomerMixReport("week", "2026-09-28", days, rows);
    expect(report.orderSeries).toHaveLength(7);
    expect(report.loginSeries).toHaveLength(7);
  });

  test("dedupes unique actors across the whole range", () => {
    const actors = [
      actor("2026-09-28", "login", "member", "u:ann"),
      actor("2026-09-29", "login", "member", "u:ann"),
      actor("2026-09-29", "login", "member", "u:bob"),
      actor("2026-09-29", "login", "guest", "e:a@x.vn"),
    ];
    const report = buildCustomerMixReport(
      "week",
      "2026-09-28",
      days,
      rows,
      actors,
    );
    expect(report.totals.memberLoginActors).toBe(2);
    expect(report.totals.guestLoginActors).toBe(1);
  });

  test("unions order kinds into buyers but skips signups", () => {
    const actors = [
      actor("2026-09-28", "booking", "member", "u:ann"),
      actor("2026-09-29", "order", "member", "u:ann"),
      actor("2026-09-28", "rescue", "guest", "e:a@x.vn"),
      actor("2026-09-28", "order", "guest", "e:a@x.vn"),
      actor("2026-09-29", "signup", "member", "u:new"),
    ];
    const report = buildCustomerMixReport(
      "week",
      "2026-09-28",
      days,
      rows,
      actors,
    );
    expect(report.totals.memberBuyers).toBe(1);
    expect(report.totals.guestBuyers).toBe(1);
    expect(report.totals.memberLoginActors).toBe(0);
  });

  test("ignores actor rows with unknown kinds or channels", () => {
    const actors = [
      actor("2026-09-28", "refund", "member", "u:x"),
      actor("2026-09-28", "login", "staff", "u:y"),
    ];
    const report = buildCustomerMixReport(
      "day",
      "2026-09-28",
      days,
      rows,
      actors,
    );
    expect(report.totals.memberLoginActors).toBe(0);
    expect(report.totals.memberBuyers).toBe(0);
  });
});
