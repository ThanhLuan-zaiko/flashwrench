// Customer-facing pages wear the navy brand header; staff portals keep the
// monochrome header (AGENTS.md brand rules). The tone is decided once per
// route in SiteHeader and passed down as a flag.
const STAFF_PATH_PREFIXES = ["/admin", "/mechanic", "/dispatch"];

export function usesNavyHeader(pathname: string): boolean {
  return !STAFF_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
