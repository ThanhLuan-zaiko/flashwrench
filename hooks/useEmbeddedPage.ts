"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  type CursorPages,
  cursorForPage,
  FIRST_PAGE_CURSORS,
  isPageKnown,
  recordNextCursor,
} from "@/lib/pagination/cursor-pages";
import { parsePageParam } from "@/lib/pagination/page-param";

// URL-driven paging for cursor lists embedded inside another screen —
// the page index lives in a namespaced query param (`?cm_<id>=2`, …) so
// several widgets can paginate one URL without touching the path. The
// pageState chain stays in an in-memory map; a cold param value with no
// walked chain is stripped back to page 1 (page-1 data already renders,
// so no bounce screen is needed).
// Requires a <Suspense> ancestor — components using this hook wrap their
// export in one when the parent page might not provide it.
export function useEmbeddedPage(param: string) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const page = parsePageParam(search.get(param)) ?? 1;
  const [cursors, setCursors] = useState<CursorPages>(FIRST_PAGE_CURSORS);
  const cursor = cursorForPage(cursors, page);
  const known = isPageKnown(cursors, page);

  // Page links carry every other param along, so unrelated widgets keep
  // their own page when one of them moves.
  const hrefFor = useCallback(
    (target: number) => {
      const q = new URLSearchParams(search.toString());
      if (target <= 1) q.delete(param);
      else q.set(param, String(target));
      const suffix = q.toString();
      return suffix ? `${pathname}?${suffix}` : pathname;
    },
    [param, pathname, search],
  );

  useEffect(() => {
    if (!known) router.replace(hrefFor(1), { scroll: false });
  }, [known, hrefFor, router]);

  // Call from the "next" link's onClick so the token lands before the
  // param moves to page + 1.
  const recordNext = useCallback(
    (nextCursor: string) =>
      setCursors((prev) => recordNextCursor(prev, page, nextCursor)),
    [page],
  );
  // Context changes (new comment posted, new target) drop the chain; the
  // caller navigates to firstHref itself from its event handler.
  const reset = useCallback(() => setCursors(FIRST_PAGE_CURSORS), []);

  return {
    page,
    cursor: cursor ?? null,
    canPrev: page > 1,
    firstHref: hrefFor(1),
    prevHref: hrefFor(page - 1),
    nextHref: hrefFor(page + 1),
    recordNext,
    reset,
  };
}
