// The public promotion grid shows at most this many campaigns. Beyond that the
// section links to the full voucher list.
export const PROMO_GRID_LIMIT = 6;

// Cell footprint of one card in a three-column grid.
export type PromoCellSpan = {
  cols: 1 | 2 | 3;
  rows: 1 | 2;
};

const FEATURED: PromoCellSpan = { cols: 2, rows: 2 };
const SINGLE: PromoCellSpan = { cols: 1, rows: 1 };
const WIDE: PromoCellSpan = { cols: 2, rows: 1 };
const FULL: PromoCellSpan = { cols: 3, rows: 1 };

// Spans for 1 to 6 cards. The first card is the featured one. Each layout
// fills its rectangle exactly, so no cell is left empty.
const LAYOUTS: Record<number, PromoCellSpan[]> = {
  1: [FULL],
  2: [WIDE, SINGLE],
  3: [FEATURED, SINGLE, SINGLE],
  4: [FEATURED, SINGLE, SINGLE, FULL],
  5: [FEATURED, SINGLE, SINGLE, SINGLE, WIDE],
  6: [FEATURED, SINGLE, SINGLE, SINGLE, SINGLE, SINGLE],
};

export function promoGridLayout(count: number): PromoCellSpan[] {
  return LAYOUTS[count] ?? [];
}

// Tailwind classes for a span. Written out in full so the class scanner sees
// every name; spans only apply from lg, where the grid has three columns.
const COL_CLASS = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
} as const;

const ROW_CLASS = {
  1: "lg:row-span-1",
  2: "lg:row-span-2",
} as const;

export function promoCellClass(span: PromoCellSpan): string {
  return `${COL_CLASS[span.cols]} ${ROW_CLASS[span.rows]}`;
}
