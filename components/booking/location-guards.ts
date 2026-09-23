export function shouldIgnoreLocatedPosition(
  pinnedByCustomer: boolean,
  onlyIfUnpinned: boolean,
): boolean {
  return pinnedByCustomer && onlyIfUnpinned;
}
