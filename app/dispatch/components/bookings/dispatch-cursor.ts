// Cursor-stack pagination for the dispatch queue. The API returns opaque
// pageState tokens instead of offsets, so the board walks a stack: entry 0
// is always null (first page), and each "next" pushes the returned cursor.
export type CursorStack = (string | null)[];

export const FIRST_PAGE_STACK: CursorStack = [null];

export function currentCursor(stack: CursorStack): string | null {
  return stack.length > 0 ? (stack[stack.length - 1] ?? null) : null;
}

export function pushCursor(stack: CursorStack, cursor: string): CursorStack {
  return [...stack, cursor];
}

export function popCursor(stack: CursorStack): CursorStack {
  return stack.length > 1 ? stack.slice(0, -1) : stack;
}

export function canGoBack(stack: CursorStack): boolean {
  return stack.length > 1;
}

export function pageNumber(stack: CursorStack): number {
  return stack.length;
}

// The pager offers "next" only when the last page handed back a cursor.
export function canGoNext(nextCursor: string | null): boolean {
  return typeof nextCursor === "string" && nextCursor.length > 0;
}
