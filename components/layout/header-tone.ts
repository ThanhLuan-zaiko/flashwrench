// Flow screens that render their own TaskBar on phones instead of the
// site header. Every route, staff portals included, wears the navy header.
const TASK_PATH_PREFIXES = ["/booking", "/checkout", "/track"];

export function usesTaskBar(pathname: string): boolean {
  return TASK_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
