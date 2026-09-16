import { describe, expect, test } from "bun:test";
import {
  isUserTab,
  USER_TABS,
  userTabHref,
} from "@/app/admin/components/users/user-tabs";

describe("user tabs", () => {
  test("exposes one route per tab", () => {
    expect(USER_TABS.map((t) => t.id)).toEqual([
      "approve",
      "lock",
      "staff",
      "trash",
      "complaints",
    ]);
    for (const tab of USER_TABS) {
      expect(tab.href).toBe(`/admin/users/${tab.id}`);
    }
  });

  test("keeps hrefs unique and English-only", () => {
    const hrefs = USER_TABS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/admin\/users\/[a-z]+$/);
    }
  });

  test("guards tab ids from unknown values", () => {
    expect(isUserTab("approve")).toBe(true);
    expect(isUserTab("lock")).toBe(true);
    expect(isUserTab("staff")).toBe(true);
    expect(isUserTab("trash")).toBe(true);
    expect(isUserTab("complaints")).toBe(true);
    expect(isUserTab("unknown")).toBe(false);
    expect(isUserTab(undefined)).toBe(false);
  });

  test("builds hrefs matching the tab list", () => {
    for (const tab of USER_TABS) {
      expect(userTabHref(tab.id)).toBe(tab.href);
    }
  });

  test("attaches one icon component per tab", () => {
    expect(USER_TABS.length).toBe(5);
    for (const tab of USER_TABS) {
      expect(typeof tab.icon).toBe("function");
    }
    const icons = USER_TABS.map((t) => t.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  test("carries one metadata title and description per tab", () => {
    for (const tab of USER_TABS) {
      expect(tab.title.length).toBeGreaterThan(0);
      expect(tab.description.length).toBeGreaterThan(0);
    }
    const titles = USER_TABS.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
