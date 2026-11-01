// Open state of the services list: at most one row is open. Tapping the open
// row closes it, tapping any other row opens that one instead.
export function toggleOpenService(
  openId: string | null,
  id: string,
): string | null {
  return openId === id ? null : id;
}
