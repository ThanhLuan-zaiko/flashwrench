import { describe, expect, test } from "bun:test";
import {
  PROMO_GRID_LIMIT,
  type PromoCellSpan,
  promoGridLayout,
} from "@/components/promotions/promo-grid-layout";

const COLUMNS = 3;

// Places cards the way the browser does for `grid-auto-flow: row` (sparse):
// the cursor only moves forward and each card starts at or after it.
function placeCards(spans: PromoCellSpan[]): boolean[][] {
  const rows: boolean[][] = [];
  const isFree = (row: number, col: number, span: PromoCellSpan) => {
    for (let r = row; r < row + span.rows; r++) {
      for (let c = col; c < col + span.cols; c++) {
        if (rows[r]?.[c]) return false;
      }
    }
    return true;
  };
  let cursorRow = 0;
  let cursorCol = 0;
  for (const span of spans) {
    let placed = false;
    for (let row = cursorRow; !placed; row++) {
      const startCol = row === cursorRow ? cursorCol : 0;
      for (let col = startCol; col + span.cols <= COLUMNS && !placed; col++) {
        if (!isFree(row, col, span)) continue;
        for (let r = row; r < row + span.rows; r++) {
          rows[r] ??= [false, false, false];
          for (let c = col; c < col + span.cols; c++) rows[r][c] = true;
        }
        cursorRow = row;
        cursorCol = col;
        placed = true;
      }
    }
  }
  return rows;
}

describe("promoGridLayout", () => {
  test("gives every count from 1 to the limit one span per card", () => {
    expect(PROMO_GRID_LIMIT).toBe(6);
    for (let count = 1; count <= PROMO_GRID_LIMIT; count++) {
      expect(promoGridLayout(count)).toHaveLength(count);
    }
  });

  test("returns no spans for an empty list", () => {
    expect(promoGridLayout(0)).toEqual([]);
  });

  test("leaves no empty cell for any count", () => {
    for (let count = 1; count <= PROMO_GRID_LIMIT; count++) {
      const rows = placeCards(promoGridLayout(count));
      const rowCount = rows.length;
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < COLUMNS; c++) {
          expect(rows[r]?.[c]).toBe(true);
        }
      }
    }
  });
});
