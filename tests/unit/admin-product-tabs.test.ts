// Admin products tabs: categories, parts and trash each own one URL;
// unknown slugs fail the guard so the shell can show a guidance panel.
import { describe, expect, test } from "bun:test";
import {
  isProductTab,
  PRODUCT_TABS,
} from "@/app/admin/components/products/product-tabs";

describe("admin product tabs", () => {
  test("exposes exactly categories, parts and trash", () => {
    expect(PRODUCT_TABS.map((t) => t.id)).toEqual([
      "categories",
      "parts",
      "trash",
    ]);
    for (const tab of PRODUCT_TABS) {
      expect(tab.href).toBe(`/admin/products/${tab.id}`);
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.title.length).toBeGreaterThan(0);
    }
  });

  test("the guard accepts the three tabs and rejects anything else", () => {
    expect(isProductTab("categories")).toBe(true);
    expect(isProductTab("parts")).toBe(true);
    expect(isProductTab("trash")).toBe(true);
    expect(isProductTab("orders")).toBe(false);
    expect(isProductTab("")).toBe(false);
    expect(isProductTab(null)).toBe(false);
  });
});
