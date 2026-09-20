// Cursor-stack pagination for the dispatch queue: the API hands back
// opaque pageState tokens, so the board walks a stack of cursors.
import { describe, expect, test } from "bun:test";
import {
  canGoBack,
  canGoNext,
  currentCursor,
  FIRST_PAGE_STACK,
  pageNumber,
  popCursor,
  pushCursor,
} from "@/app/dispatch/components/bookings/dispatch-cursor";

describe("cursor stack", () => {
  test("the first page always reads a null cursor", () => {
    expect(currentCursor(FIRST_PAGE_STACK)).toBeNull();
    expect(pageNumber(FIRST_PAGE_STACK)).toBe(1);
    expect(canGoBack(FIRST_PAGE_STACK)).toBe(false);
  });

  test("push walks forward and pop walks back without mutating", () => {
    const page2 = pushCursor(FIRST_PAGE_STACK, "cursor-b");
    expect(FIRST_PAGE_STACK).toEqual([null]);
    expect(currentCursor(page2)).toBe("cursor-b");
    expect(pageNumber(page2)).toBe(2);
    expect(canGoBack(page2)).toBe(true);

    const page3 = pushCursor(page2, "cursor-c");
    expect(currentCursor(page3)).toBe("cursor-c");
    expect(pageNumber(page3)).toBe(3);

    const backTo2 = popCursor(page3);
    expect(currentCursor(backTo2)).toBe("cursor-b");
    expect(page3).toHaveLength(3);

    const backTo1 = popCursor(popCursor(page3));
    expect(backTo1).toEqual([null]);
    expect(popCursor(backTo1)).toEqual([null]);
  });

  test("next is only offered for a non-empty cursor", () => {
    expect(canGoNext("opaque-state")).toBe(true);
    expect(canGoNext(null)).toBe(false);
    expect(canGoNext("")).toBe(false);
  });
});
