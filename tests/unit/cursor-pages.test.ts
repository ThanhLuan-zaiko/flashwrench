// Page-indexed cursor map: tokens resolve visited pages in both
// directions and unvisited deep pages report "unknown" so the caller can
// bounce the URL back to the list root.
import { describe, expect, test } from "bun:test";
import {
  cursorForPage,
  FIRST_PAGE_CURSORS,
  isPageKnown,
  recordNextCursor,
} from "@/lib/pagination/cursor-pages";

describe("cursorForPage", () => {
  test("page 1 never needs a cursor", () => {
    expect(cursorForPage(FIRST_PAGE_CURSORS, 1)).toBeNull();
    expect(isPageKnown(FIRST_PAGE_CURSORS, 1)).toBe(true);
  });

  test("unvisited pages are unknown", () => {
    expect(cursorForPage(FIRST_PAGE_CURSORS, 2)).toBeUndefined();
    expect(isPageKnown(FIRST_PAGE_CURSORS, 3)).toBe(false);
  });
});

describe("recordNextCursor", () => {
  test("records the token that unlocks the next page", () => {
    const cursors = recordNextCursor(FIRST_PAGE_CURSORS, 1, "c2");
    expect(cursorForPage(cursors, 2)).toBe("c2");
    expect(isPageKnown(cursors, 2)).toBe(true);
    const deeper = recordNextCursor(cursors, 2, "c3");
    expect(cursorForPage(deeper, 3)).toBe("c3");
  });

  test("going back then forward re-records instead of appending", () => {
    let cursors = recordNextCursor(FIRST_PAGE_CURSORS, 1, "c2");
    cursors = recordNextCursor(cursors, 2, "c3");
    cursors = recordNextCursor(cursors, 1, "c2b");
    expect(cursors).toEqual([null, "c2b"]);
    expect(cursorForPage(cursors, 3)).toBeUndefined();
  });

  test("never mutates the previous state", () => {
    const before = recordNextCursor(FIRST_PAGE_CURSORS, 1, "c2");
    recordNextCursor(before, 2, "c3");
    expect(before).toEqual([null, "c2"]);
    expect(FIRST_PAGE_CURSORS).toEqual([null]);
  });
});
