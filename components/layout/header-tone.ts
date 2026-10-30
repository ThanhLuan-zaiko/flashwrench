// Customer-facing pages wear the navy brand header; staff portals keep the
// monochrome header (AGENTS.md brand rules). The tone is decided once per
// route in SiteHeader and passed down as a flag.
const STAFF_PATH_PREFIXES = ["/admin", "/mechanic", "/dispatch"];

// Flow screens that render their own TaskBar on phones instead of the
// site header.
const TASK_PATH_PREFIXES = ["/booking", "/checkout", "/track"];

export function usesTaskBar(pathname: string): boolean {
  return TASK_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function usesNavyHeader(pathname: string): boolean {
  return !STAFF_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
