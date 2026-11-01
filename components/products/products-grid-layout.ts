// Cell layout for the products shelf grid: 2 columns below `lg`, 5 from `lg`.
// A page that does not fill its last row gives the last tile the remaining
// columns, so the grid never ends with an empty cell (frontend-bento-gsap.md
// section 3.2 rule 2). Class names are literal strings so the Tailwind scanner
// keeps them.

export const PRODUCTS_GRID_LG_COLUMNS = 5;

// "stack": photo above the text. "row": photo beside the text at every size.
// "row-lg": stacked on phones, beside the text from lg. "row-phone": beside the
// text on phones, stacked from lg.
export type ProductTileLayout = "stack" | "row" | "row-lg" | "row-phone";

export type ProductCellLayout = {
  span: string;
  tile: ProductTileLayout;
};

const LG_SPAN_BY_REMAINDER: Record<number, string> = {
  1: "lg:col-span-5",
  2: "lg:col-span-4",
  3: "lg:col-span-3",
  4: "lg:col-span-2",
};

// Layout of the tile at `index` on a page of `count` tiles. The last tile may
// need to span: on phones when the count is odd (it sits alone in its row),
// on desktop when the count does not fill the five-column row.
export function productCellLayout(
  index: number,
  count: number,
): ProductCellLayout {
  const stack: ProductCellLayout = { span: "", tile: "stack" };
  if (index !== count - 1) return stack;

  const lgRemainder = count % PRODUCTS_GRID_LG_COLUMNS;
  const aloneOnPhone = count % 2 === 1;
  const lgSpan = lgRemainder === 0 ? "" : LG_SPAN_BY_REMAINDER[lgRemainder];

  if (aloneOnPhone && lgSpan) {
    return { span: `col-span-2 ${lgSpan}`, tile: "row" };
  }
  if (aloneOnPhone) {
    return { span: "col-span-2", tile: "row-phone" };
  }
  if (lgSpan) {
    return { span: lgSpan, tile: "row-lg" };
  }
  return stack;
}
