import { describe, expect, test } from "bun:test";
import {
  CATALOG_PAGE_SIZE,
  clampPage,
  pageCountOf,
  pageRange,
  pageWindow,
  paginateItems,
  parsePageInput,
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

describe("pageWindow", () => {
  test("lists every page when the count is short", () => {
    expect(pageWindow(0, 1)).toEqual([0]);
    expect(pageWindow(0, 3)).toEqual([0, 1, 2]);
    expect(pageWindow(2, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  test("keeps head visible near the start", () => {
    expect(pageWindow(0, 10)).toEqual([0, 1, 2, 3, "ellipsis", 9]);
    expect(pageWindow(2, 10)).toEqual([0, 1, 2, 3, "ellipsis", 9]);
  });

  test("keeps tail visible near the end", () => {
    expect(pageWindow(9, 10)).toEqual([0, "ellipsis", 5, 6, 7, 8, 9]);
    expect(pageWindow(7, 10)).toEqual([0, "ellipsis", 5, 6, 7, 8, 9]);
  });

  test("centers the window with gaps in the middle", () => {
    expect(pageWindow(4, 10)).toEqual([0, "ellipsis", 3, 4, 5, "ellipsis", 9]);
  });

  test("clamps out-of-range pages instead of returning nothing", () => {
    expect(pageWindow(99, 10)[0]).toBe(0);
    expect(pageWindow(-5, 3)).toEqual([0, 1, 2]);
  });
});

describe("parsePageInput", () => {
  test("converts 1-based input to a 0-based index", () => {
    expect(parsePageInput("1", 10)).toBe(0);
    expect(parsePageInput("10", 10)).toBe(9);
    expect(parsePageInput(" 3 ", 10)).toBe(2);
  });

  test("clamps numbers past the last page", () => {
    expect(parsePageInput("99", 10)).toBe(9);
  });

  test("rejects non-numeric input", () => {
    expect(parsePageInput("", 10)).toBeNull();
    expect(parsePageInput("abc", 10)).toBeNull();
    expect(parsePageInput("2.5", 10)).toBeNull();
    expect(parsePageInput("0", 10)).toBeNull();
    expect(parsePageInput("-3", 10)).toBeNull();
    expect(parsePageInput("3 trang", 10)).toBeNull();
  });
});
