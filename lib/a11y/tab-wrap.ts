// Decides where Tab or Shift+Tab should land inside a modal so focus cannot
// leave it. `index` is the position of the focused item among the dialog's
// focusable elements, or -1 when focus sits on the dialog container itself
// or outside it. Returns the index to focus, or null to let the browser move
// focus normally.
export function tabWrapTarget(
  count: number,
  index: number,
  shiftKey: boolean,
): number | null {
  if (count <= 0) return null;
  if (shiftKey) return index <= 0 ? count - 1 : null;
  return index === -1 || index === count - 1 ? 0 : null;
}
