// Pure pagination helpers for admin lists. Small config tables slice
// client-side; large tables must paginate server-side (limit/offset or
// cursor) and only reuse the page-window math below.

export const CATALOG_PAGE_SIZE = 8;

export function pageCountOf(
  total: number,
  pageSize: number = CATALOG_PAGE_SIZE,
): number {
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(
  page: number,
  total: number,
  pageSize: number = CATALOG_PAGE_SIZE,
): number {
  if (!Number.isInteger(page)) return 0;
  return Math.min(Math.max(0, page), pageCountOf(total, pageSize) - 1);
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = CATALOG_PAGE_SIZE,
): T[] {
  const current = clampPage(page, items.length, pageSize);
  return items.slice(current * pageSize, current * pageSize + pageSize);
}

export function pageRange(
  page: number,
  total: number,
  pageSize: number = CATALOG_PAGE_SIZE,
): { start: number; end: number } {
  if (total <= 0) return { start: 0, end: 0 };
  const current = clampPage(page, total, pageSize);
  return {
    start: current * pageSize + 1,
    end: Math.min(total, (current + 1) * pageSize),
  };
}

export type PageToken = number | "ellipsis";

// Parses a 1-based page number typed into the jump box. Returns the
// 0-based page index clamped into range, or null when the input is
// not a plain positive integer.
export function parsePageInput(text: string, pageCount: number): number | null {
  const safeCount = Number.isInteger(pageCount) ? Math.max(1, pageCount) : 1;
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const oneBased = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(oneBased) || oneBased < 1) return null;
  return Math.min(oneBased, safeCount) - 1;
}
// Window of page indexes for the pager. Shows every page when the list
// is short, otherwise first/last plus neighbors around current with
// ellipsis gaps. Pure so the pager stays a thin render layer.
export function pageWindow(
  page: number,
  pageCount: number,
  sibling: number = 1,
): PageToken[] {
  const safeCount = Number.isInteger(pageCount) ? Math.max(1, pageCount) : 1;
  const current = Number.isInteger(page)
    ? Math.min(Math.max(0, page), safeCount - 1)
    : 0;
  const safeSibling = Number.isInteger(sibling) ? Math.max(0, sibling) : 1;
  if (safeCount <= 7) {
    return Array.from({ length: safeCount }, (_, i) => i);
  }
  if (current <= 2 + safeSibling - 1) {
    const head = Array.from({ length: 3 + safeSibling }, (_, i) => i);
    return [...head, "ellipsis", safeCount - 1];
  }
  if (current >= safeCount - 3 - safeSibling) {
    const tailStart = safeCount - 4 - safeSibling;
    const tail = Array.from(
      { length: safeCount - tailStart },
      (_, i) => tailStart + i,
    );
    return [0, "ellipsis", ...tail];
  }
  const middle = Array.from(
    { length: safeSibling * 2 + 1 },
    (_, i) => current - safeSibling + i,
  );
  return [0, "ellipsis", ...middle, "ellipsis", safeCount - 1];
}
