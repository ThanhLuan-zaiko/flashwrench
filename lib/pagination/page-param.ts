// URL path pagination: every paged screen puts the 1-based page in a
// trailing `/page/N` segment so links stay shareable and the browser
// back button walks pages. Page 1 is always the bare base path
// (/page/1 canonicalizes to the base URL).

export const PAGE_SEGMENT = "page";

// Parses the `page` route param. Returns null for anything that is not a
// plain positive integer — leaf page.tsx files treat null as "redirect
// back to the list root".
export function parsePageParam(
  raw: string | string[] | null | undefined,
): number | null {
  const text = Array.isArray(raw) ? (raw[0] ?? null) : raw;
  if (!text || !/^\d+$/.test(text)) return null;
  const value = Number.parseInt(text, 10);
  return Number.isSafeInteger(value) && value >= 1 ? value : null;
}

// Builds the href for a 1-based page: page 1 (or anything below) is the
// base path itself so canonical URLs never carry `/page/1`.
export function pagePath(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}/${PAGE_SEGMENT}/${page}`;
}

// Strips a trailing `/page/<segment>` from a pathname so screens mounted
// once in a layout can recover their list root for pager links.
export function stripPageSegment(pathname: string): string {
  return pathname.replace(/\/page\/[^/]+$/, "");
}
