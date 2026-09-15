import { describe, expect, test } from "bun:test";
import {
  CATALOG_PAGE_SIZE,
  clampPage,
  pageCountOf,
  pageRange,
  paginateItems,
} from "@/app/admin/components/services/catalog-pagination";

const NINE = Array.from({ length: 9 }, (_, i) => `item-${i}`);

describe("pageCountOf", () => {
  test("returns one page for empty lists", () => {
    expect(pageCountOf(0)).toBe(1);
  });

  test("rounds up partial pages", () => {
    expect(pageCountOf(CATALOG_PAGE_SIZE)).toBe(1);
    expect(pageCountOf(CATALOG_PAGE_SIZE + 1)).toBe(2);
  });
});

describe("clampPage", () => {
  test("keeps pages inside bounds", () => {
    expect(clampPage(-1, 9)).toBe(0);
    expect(clampPage(5, 9)).toBe(1);
  });

  test("rejects non-integer pages", () => {
    expect(clampPage(1.5, 9)).toBe(0);
  });
});

describe("paginateItems", () => {
  test("slices the requested window", () => {
    expect(paginateItems(NINE, 0)).toHaveLength(CATALOG_PAGE_SIZE);
    expect(paginateItems(NINE, 1)).toEqual(["item-8"]);
  });

  test("clamps out-of-range pages instead of returning nothing", () => {
    expect(paginateItems(NINE, 9)).toEqual(["item-8"]);
  });
});

describe("pageRange", () => {
  test("reports one-based bounds for the pager label", () => {
    expect(pageRange(0, 9)).toEqual({ start: 1, end: CATALOG_PAGE_SIZE });
    expect(pageRange(1, 9)).toEqual({ start: 9, end: 9 });
    expect(pageRange(0, 0)).toEqual({ start: 0, end: 0 });
  });
});
