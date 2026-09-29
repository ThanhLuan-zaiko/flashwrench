// Pure state transitions for Trước/Sau cursor paging. `history` holds the
// cursor of every page already left, so stepping back restores exactly the
// page the user came from (not the one before it).
export type CursorStack = {
  cursor: string | null;
  history: (string | null)[];
};

export const EMPTY_CURSOR_STACK: CursorStack = { cursor: null, history: [] };

export function advanceCursor(
  state: CursorStack,
  nextCursor: string | null,
): CursorStack {
  return {
    cursor: nextCursor,
    history: [...state.history, state.cursor],
  };
}

export function retreatCursor(state: CursorStack): CursorStack {
  if (state.history.length === 0) return state;
  return {
    cursor: state.history[state.history.length - 1] ?? null,
    history: state.history.slice(0, -1),
  };
}
