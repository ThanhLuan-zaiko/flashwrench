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
