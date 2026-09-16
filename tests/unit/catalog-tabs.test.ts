import { describe, expect, test } from "bun:test";
import {
  CATALOG_TABS,
  catalogTabHref,
  isCatalogTab,
} from "@/app/admin/components/services/catalog-tabs";

describe("catalog tabs", () => {
  test("exposes one route per tab", () => {
    expect(CATALOG_TABS.map((t) => t.id)).toEqual([
      "categories",
      "prices",
      "trash",
    ]);
    for (const tab of CATALOG_TABS) {
      expect(tab.href).toBe(`/admin/services/${tab.id}`);
    }
  });

  test("keeps hrefs unique and English-only", () => {
    const hrefs = CATALOG_TABS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/admin\/services\/[a-z]+$/);
    }
  });

  test("guards tab ids from unknown values", () => {
    expect(isCatalogTab("categories")).toBe(true);
    expect(isCatalogTab("prices")).toBe(true);
    expect(isCatalogTab("trash")).toBe(true);
    expect(isCatalogTab("unknown")).toBe(false);
    expect(isCatalogTab(undefined)).toBe(false);
  });

  test("builds hrefs matching the tab list", () => {
    for (const tab of CATALOG_TABS) {
      expect(catalogTabHref(tab.id)).toBe(tab.href);
    }
  });

  test("attaches one icon component per tab", () => {
    expect(CATALOG_TABS.length).toBe(3);
    for (const tab of CATALOG_TABS) {
      expect(typeof tab.icon).toBe("function");
    }
    const icons = CATALOG_TABS.map((t) => t.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  test("carries one metadata title and description per tab", () => {
    for (const tab of CATALOG_TABS) {
      expect(tab.title.length).toBeGreaterThan(0);
      expect(tab.description.length).toBeGreaterThan(0);
    }
    const titles = CATALOG_TABS.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
