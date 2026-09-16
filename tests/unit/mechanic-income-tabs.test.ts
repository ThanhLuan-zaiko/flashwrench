import { describe, expect, test } from "bun:test";
import {
  INCOME_TABS,
  incomeTabHref,
  isIncomeTab,
} from "@/app/mechanic/components/income/income-tabs";

describe("income tabs", () => {
  test("exposes one route per tab", () => {
    expect(INCOME_TABS.map((t) => t.id)).toEqual([
      "all",
      "paid",
      "refunded",
    ]);
    for (const tab of INCOME_TABS) {
      expect(tab.href).toBe(`/mechanic/income/${tab.id}`);
    }
  });

  test("keeps hrefs unique and English-only", () => {
    const hrefs = INCOME_TABS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/mechanic\/income\/[a-z]+$/);
    }
  });

  test("guards tab ids from unknown values", () => {
    expect(isIncomeTab("all")).toBe(true);
    expect(isIncomeTab("paid")).toBe(true);
    expect(isIncomeTab("unpaid")).toBe(false);
    expect(isIncomeTab("unknown")).toBe(false);
    expect(isIncomeTab(undefined)).toBe(false);
  });

  test("builds hrefs matching the tab list", () => {
    for (const tab of INCOME_TABS) {
      expect(incomeTabHref(tab.id)).toBe(tab.href);
    }
  });

  test("every tab carries an icon for the pill strip", () => {
    for (const tab of INCOME_TABS) {
      expect(tab.icon).toBeDefined();
    }
    const icons = INCOME_TABS.map((t) => t.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
