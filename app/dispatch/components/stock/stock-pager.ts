export const STOCK_PAGE_SIZE = 10;

export function stockPageCount(totalItems: number): number {
  return Math.max(1, Math.ceil(totalItems / STOCK_PAGE_SIZE));
}

// Keep the current page inside bounds when the list shrinks (deletes,
// filters) while the user sits on a now-empty page.
export function clampPage(page: number, totalItems: number): number {
  return Math.min(Math.max(page, 1), stockPageCount(totalItems));
}

export type PageSlice<T> = {
  items: T[];
  from: number;
  to: number;
};

// 1-based slicing for the stock page: `from`/`to` describe the visible
// range so the pager can render "Hiển thị 11–20 / 34 mục".
export function pageSlice<T>(all: T[], page: number): PageSlice<T> {
  const clamped = clampPage(page, all.length);
  const from = all.length === 0 ? 0 : (clamped - 1) * STOCK_PAGE_SIZE + 1;
  const to = Math.min(clamped * STOCK_PAGE_SIZE, all.length);
  return { items: all.slice(from - 1, to), from, to };
}

export type PageButton = number | "ellipsis";

// Numbered pager layout: first + last are always pinned, the current page
// keeps one neighbour on each side, gaps collapse into an ellipsis. Lists
// of 7 or fewer pages render fully so small catalogs never see the dots.
export function pageButtons(page: number, totalPages: number): PageButton[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) {
    for (const n of [2, 3, 4]) wanted.add(n);
  }
  if (page >= totalPages - 2) {
    for (const n of [totalPages - 1, totalPages - 2, totalPages - 3]) {
      wanted.add(n);
    }
  }
  const sorted = [...wanted]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const out: PageButton[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("ellipsis");
    out.push(n);
    prev = n;
  }
  return out;
}
