// Trước/Sau cursor paging transitions: stepping back must land on the page
// the user came from, however many pages deep they went.
import { describe, expect, test } from "bun:test";
import {
  advanceCursor,
  EMPTY_CURSOR_STACK,
  retreatCursor,
} from "@/lib/pagination/cursor-stack";

describe("cursor stack", () => {
  test("starts on the first page with nothing to go back to", () => {
    expect(EMPTY_CURSOR_STACK).toEqual({ cursor: null, history: [] });
  });

  test("advancing remembers the page that was left", () => {
    const second = advanceCursor(EMPTY_CURSOR_STACK, "c2");
    expect(second).toEqual({ cursor: "c2", history: [null] });
    const third = advanceCursor(second, "c3");
    expect(third).toEqual({ cursor: "c3", history: [null, "c2"] });
  });

  test("retreating restores the previous page, not the first one", () => {
    const third = advanceCursor(advanceCursor(EMPTY_CURSOR_STACK, "c2"), "c3");
    const back = retreatCursor(third);
    expect(back).toEqual({ cursor: "c2", history: [null] });
    expect(retreatCursor(back)).toEqual(EMPTY_CURSOR_STACK);
  });

  test("retreating on the first page is a no-op", () => {
    expect(retreatCursor(EMPTY_CURSOR_STACK)).toBe(EMPTY_CURSOR_STACK);
  });

  test("transitions never mutate the previous state", () => {
    const start = advanceCursor(EMPTY_CURSOR_STACK, "c2");
    advanceCursor(start, "c3");
    retreatCursor(start);
    expect(start).toEqual({ cursor: "c2", history: [null] });
    expect(EMPTY_CURSOR_STACK).toEqual({ cursor: null, history: [] });
  });
});
