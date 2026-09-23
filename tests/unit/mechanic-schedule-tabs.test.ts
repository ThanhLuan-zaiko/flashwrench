import { describe, expect, test } from "bun:test";
import {
  isScheduleTab,
  SCHEDULE_TABS,
  scheduleTabHref,
  shouldResetSchedulePager,
} from "@/app/mechanic/components/schedule/schedule-tabs";

describe("schedule tabs", () => {
  test("exposes one route per tab", () => {
    expect(SCHEDULE_TABS.map((t) => t.id)).toEqual([
      "all",
      "pending",
      "confirmed",
      "mechanic_assigned",
      "en_route",
      "in_progress",
      "completed",
      "cancelled",
    ]);
    for (const tab of SCHEDULE_TABS) {
      expect(tab.href).toBe(`/mechanic/schedule/${tab.id}`);
    }
  });

  test("keeps hrefs unique and English-only", () => {
    const hrefs = SCHEDULE_TABS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/mechanic\/schedule\/[a-z_]+$/);
    }
  });

  test("guards tab ids from unknown values", () => {
    expect(isScheduleTab("all")).toBe(true);
    expect(isScheduleTab("pending")).toBe(true);
    expect(isScheduleTab("no_show")).toBe(false);
    expect(isScheduleTab("unknown")).toBe(false);
    expect(isScheduleTab(undefined)).toBe(false);
  });

  test("resets only the pager when the URL tab changes", () => {
    expect(shouldResetSchedulePager("en_route", "in_progress")).toBe(true);
    expect(shouldResetSchedulePager("en_route", "en_route")).toBe(false);
  });

  test("builds hrefs matching the tab list", () => {
    for (const tab of SCHEDULE_TABS) {
      expect(scheduleTabHref(tab.id)).toBe(tab.href);
    }
  });

  test("every tab carries an icon for the pill strip", () => {
    for (const tab of SCHEDULE_TABS) {
      expect(tab.icon).toBeDefined();
    }
    const icons = SCHEDULE_TABS.map((t) => t.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
