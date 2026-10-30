// Day-level series behind the mechanic performance page: 7-day income,
// week-over-week, 12-week heatmap, streak and busiest weekday — plus the
// display helpers and heatmap levels. Pure, no mocks.
import { describe, expect, test } from "bun:test";
import {
  compactMoney,
  weekChange,
  weekLabels,
} from "@/app/mechanic/components/stats/stats-format";
import { heatLevel } from "@/components/charts/chart-draw-heatmap";
import {
  buildMechanicDaily,
  type DailyJob,
  HEATMAP_DAYS,
  shiftDayKey,
  weekdayOf,
} from "@/lib/mechanic/mechanic-stats-daily";

// Tuesday 15 Sep 2026, mid-morning in Ho Chi Minh City.
const NOW = new Date("2026-09-15T10:00:00+07:00");
const done = (iso: string, total = 100_000): DailyJob => ({
  scheduledAt: new Date(iso),
  completed: true,
  total,
});

describe("day keys", () => {
  test("shift across month edges and map weekdays Monday-first", () => {
    expect(shiftDayKey("2026-10-01", 1)).toBe("2026-09-30");
    expect(shiftDayKey("2026-09-15", 6)).toBe("2026-09-09");
    expect(weekdayOf("2026-09-14")).toBe(0); // Monday
    expect(weekdayOf("2026-09-20")).toBe(6); // Sunday
  });
});

describe("buildMechanicDaily", () => {
  test("splits this week and last week by day in the shop zone", () => {
    const daily = buildMechanicDaily(
      [
        done("2026-09-15T08:00:00+07:00", 300_000),
        done("2026-09-14T23:30:00+07:00", 200_000),
        done("2026-09-08T09:00:00+07:00", 150_000),
        {
          scheduledAt: new Date("2026-09-15T09:00:00+07:00"),
          completed: false,
          total: 999,
        },
      ],
      NOW,
    );
    expect(daily.week).toHaveLength(7);
    expect(daily.week.at(-1)).toEqual({
      day: "2026-09-15",
      completed: 1,
      revenue: 300_000,
    });
    expect(daily.weekRevenue).toBe(500_000);
    expect(daily.weekCompleted).toBe(2);
    expect(daily.previousWeekRevenue).toBe(150_000);
    expect(daily.previousWeekCompleted).toBe(1);
    expect(daily.heatmap).toHaveLength(HEATMAP_DAYS);
  });

  test("streak survives a quiet morning and stops at the first gap", () => {
    const daily = buildMechanicDaily(
      [
        done("2026-09-14T09:00:00+07:00"),
        done("2026-09-13T09:00:00+07:00"),
        done("2026-09-11T09:00:00+07:00"),
      ],
      NOW,
    );
    expect(daily.streak).toBe(2);
  });

  test("busiest weekday counts completions over 12 weeks", () => {
    const daily = buildMechanicDaily(
      [
        done("2026-09-12T09:00:00+07:00"),
        done("2026-09-05T09:00:00+07:00"),
        done("2026-09-14T09:00:00+07:00"),
      ],
      NOW,
    );
    expect(daily.busiestWeekday).toBe(5); // Saturday
  });

  test("ignores invalid dates, jobs outside the window and negative totals", () => {
    const daily = buildMechanicDaily(
      [
        { scheduledAt: null, completed: true, total: 1 },
        { scheduledAt: new Date("bad"), completed: true, total: 1 },
        done("2026-01-01T09:00:00+07:00"),
        done("2026-09-15T09:00:00+07:00", -500),
      ],
      NOW,
    );
    expect(daily.weekRevenue).toBe(0);
    expect(daily.weekCompleted).toBe(1);
    expect(buildMechanicDaily([], NOW).busiestWeekday).toBeNull();
  });
});

describe("display helpers", () => {
  test("compactMoney keeps significant digits with a Vietnamese comma", () => {
    expect(compactMoney(1_250_000)).toBe("1,25tr");
    expect(compactMoney(1_500_000)).toBe("1,5tr");
    expect(compactMoney(1_000_000)).toBe("1tr");
    expect(compactMoney(10_000_000)).toBe("10tr");
    expect(compactMoney(850_000)).toBe("850k");
    expect(compactMoney(0)).toBe("0");
  });

  test("weekChange compares with last week or explains the missing base", () => {
    expect(weekChange(120, 100)).toBe("+20% so với tuần trước");
    expect(weekChange(50, 100)).toBe("-50% so với tuần trước");
    expect(weekChange(5, 0)).toBe("Tuần trước chưa có số liệu");
    expect(weekChange(0, 0)).toBe("Chưa có số liệu");
  });

  test("weekLabels name each day and mark today", () => {
    expect(weekLabels(["2026-09-13", "2026-09-14", "2026-09-15"])).toEqual([
      "CN",
      "T2",
      "Hôm nay",
    ]);
  });

  test("heatLevel buckets counts relative to the busiest day", () => {
    expect(heatLevel(0, 5)).toBe(0);
    expect(heatLevel(1, 8)).toBe(1);
    expect(heatLevel(8, 8)).toBe(4);
    expect(heatLevel(3, 0)).toBe(0);
  });
});
