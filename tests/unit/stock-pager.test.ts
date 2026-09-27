import { describe, expect, test } from "bun:test";
import {
  clampPage,
  pageButtons,
  pageSlice,
  STOCK_PAGE_SIZE,
  stockPageCount,
} from "@/app/dispatch/components/stock/stock-pager";

describe("stockPageCount / clampPage", () => {
  test("empty list still yields one page", () => {
    expect(stockPageCount(0)).toBe(1);
    expect(clampPage(5, 0)).toBe(1);
  });

  test("rounds up partial pages", () => {
    expect(stockPageCount(STOCK_PAGE_SIZE)).toBe(1);
    expect(stockPageCount(STOCK_PAGE_SIZE + 1)).toBe(2);
    expect(stockPageCount(34)).toBe(4);
  });

  test("clamps out-of-range pages back into bounds", () => {
    expect(clampPage(0, 34)).toBe(1);
    expect(clampPage(-3, 34)).toBe(1);
    expect(clampPage(99, 34)).toBe(4);
    expect(clampPage(2, 34)).toBe(2);
  });
});

describe("pageSlice", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  test("returns the 1-based window and its range labels", () => {
    const page2 = pageSlice(items, 2);
    expect(page2.items).toEqual(Array.from({ length: 10 }, (_, i) => i + 11));
    expect(page2.from).toBe(11);
    expect(page2.to).toBe(20);
  });

  test("last page stops at the item count", () => {
    const page3 = pageSlice(items, 3);
    expect(page3.items).toHaveLength(3);
    expect(page3.to).toBe(23);
  });

  test("overflowing page clamps instead of slicing empty", () => {
    const page = pageSlice(items, 9);
    expect(page.items).toHaveLength(3);
    expect(page.from).toBe(21);
  });

  test("empty list reports a zero range", () => {
    const page = pageSlice([], 1);
    expect(page.items).toEqual([]);
    expect(page.from).toBe(0);
    expect(page.to).toBe(0);
  });
});

describe("pageButtons", () => {
  test("small catalogs render every page", () => {
    expect(pageButtons(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageButtons(1, 1)).toEqual([1]);
  });

  test("middle pages keep one neighbour and both ends", () => {
    expect(pageButtons(6, 12)).toEqual([
      1,
      "ellipsis",
      5,
      6,
      7,
      "ellipsis",
      12,
    ]);
  });

  test("the head of the list never collapses the first pages", () => {
    expect(pageButtons(1, 12)).toEqual([1, 2, 3, 4, "ellipsis", 12]);
    expect(pageButtons(2, 12)).toEqual([1, 2, 3, 4, "ellipsis", 12]);
  });

  test("the tail mirrors the head", () => {
    expect(pageButtons(12, 12)).toEqual([1, "ellipsis", 9, 10, 11, 12]);
  });
});
