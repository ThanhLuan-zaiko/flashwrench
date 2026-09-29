"use client";

import { useState } from "react";
import {
  advanceCursor,
  EMPTY_CURSOR_STACK,
  retreatCursor,
} from "@/lib/pagination/cursor-stack";

// Trước/Sau paging over a server cursor. Remount (change the `key`) or call
// `reset` when the underlying list changes so a cursor from one partition is
// never reused on another.
export function useCursorPager() {
  const [state, setState] = useState(EMPTY_CURSOR_STACK);
  return {
    cursor: state.cursor,
    canPrev: state.history.length > 0,
    next: (nextCursor: string | null) =>
      setState((current) => advanceCursor(current, nextCursor)),
    prev: () => setState(retreatCursor),
    reset: () => setState(EMPTY_CURSOR_STACK),
  };
}
