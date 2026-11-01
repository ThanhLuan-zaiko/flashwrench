// Screens that keep their own chrome: staff portals have a sidebar shell and
// flow screens render the TaskBar, so the site footer stays out of them.
const HIDDEN_PREFIXES = [
  "/admin",
  "/dispatch",
  "/mechanic",
  "/booking",
  "/checkout",
  "/track",
];

export function footerHidden(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
