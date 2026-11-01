// Shelf grid cell layout: every page must fill its last row. The test replays
// the browser's row-major auto-placement with the spans that productCellLayout
// returns, for the 2-column phone grid and the 5-column desktop grid.
import { describe, expect, test } from "bun:test";
import {
  PRODUCTS_GRID_LG_COLUMNS,
  productCellLayout,
} from "@/components/products/products-grid-layout";
import { PRODUCTS_PAGE_SIZE } from "@/components/products/products-utils";

// Read the column span from a class string such as "col-span-2 lg:col-span-5".
function spanAt(classes: string, prefix: "" | "lg:"): number {
  const pattern = prefix === "" ? /(?<!lg:)col-span-(\d)/ : /lg:col-span-(\d)/;
  const match = classes.match(pattern);
  return match ? Number(match[1]) : 1;
}

// Sum of spans for one page at a breakpoint with `columns` columns.
function occupiedCells(count: number, columns: 2 | 5): number {
  const prefix = columns === 2 ? "" : "lg:";
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    const { span } = productCellLayout(index, count);
    total += spanAt(span, prefix);
  }
  return total;
}

describe("productCellLayout", () => {
  test("the desktop grid has five columns and a full page of ten", () => {
    expect(PRODUCTS_GRID_LG_COLUMNS).toBe(5);
    expect(PRODUCTS_PAGE_SIZE).toBe(10);
  });

  test("a full page has no spanned cell", () => {
    for (let index = 0; index < PRODUCTS_PAGE_SIZE; index += 1) {
      expect(productCellLayout(index, PRODUCTS_PAGE_SIZE)).toEqual({
        span: "",
        tile: "stack",
      });
    }
  });

  test("every page size fills whole rows on phone and desktop", () => {
    for (let count = 1; count <= PRODUCTS_PAGE_SIZE; count += 1) {
      expect(occupiedCells(count, 2) % 2).toBe(0);
      expect(occupiedCells(count, 5) % 5).toBe(0);
    }
  });

  test("an odd page with a partial desktop row spans on both grids", () => {
    expect(productCellLayout(6, 7)).toEqual({
      span: "col-span-2 lg:col-span-4",
      tile: "row",
    });
    expect(productCellLayout(0, 1)).toEqual({
      span: "col-span-2 lg:col-span-5",
      tile: "row",
    });
  });

  test("an odd page with a full desktop row spans only on phones", () => {
    expect(productCellLayout(4, 5)).toEqual({
      span: "col-span-2",
      tile: "row-phone",
    });
  });

  test("an even page with a partial desktop row spans from lg only", () => {
    expect(productCellLayout(5, 6)).toEqual({
      span: "lg:col-span-5",
      tile: "row-lg",
    });
    expect(productCellLayout(7, 8)).toEqual({
      span: "lg:col-span-3",
      tile: "row-lg",
    });
  });

  test("the desktop span never exceeds the five columns", () => {
    for (let count = 1; count <= PRODUCTS_PAGE_SIZE; count += 1) {
      for (let index = 0; index < count; index += 1) {
        expect(
          spanAt(productCellLayout(index, count).span, "lg:"),
        ).toBeLessThanOrEqual(5);
      }
    }
  });
});
