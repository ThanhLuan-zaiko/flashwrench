// Page-indexed cursor map for `/page/N` over sequential server paging.
// ScyllaDB pageState tokens only walk forward, so the map records the
// token that produced each visited page: `cursors[i]` is the cursor that
// fetches page `i + 1` and entry 0 is always null (page 1 needs none).
// The array is never truncated — going back keeps the recorded tokens so
// browser forward still resolves every visited page.

export type CursorPages = (string | null)[];

export const FIRST_PAGE_CURSORS: CursorPages = [null];

// Cursor to fetch `page` (1-based). Undefined means the walk never
// reached that page — the caller must redirect to the list root because
// a mid-chain pageState cannot be reconstructed from the URL alone.
export function cursorForPage(
  cursors: CursorPages,
  page: number,
): string | null | undefined {
  if (page <= 1) return null;
  return cursors[page - 1];
}

// Records the nextCursor returned while displaying `page`, making page
// `page + 1` reachable. Idempotent: re-recording the same page keeps the
// newest token and drops nothing else.
export function recordNextCursor(
  cursors: CursorPages,
  page: number,
  nextCursor: string,
): CursorPages {
  const next = cursors.slice(0, Math.max(page, 0));
  next[page] = nextCursor;
  return next;
}

// True when `cursorForPage` resolves — i.e. the URL page was reached by
// walking, not typed or restored cold.
export function isPageKnown(cursors: CursorPages, page: number): boolean {
  return cursorForPage(cursors, page) !== undefined;
}
