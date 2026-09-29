"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useRoutePage } from "@/hooks/useRoutePage";
import {
  type CursorPages,
  cursorForPage,
  FIRST_PAGE_CURSORS,
  isPageKnown,
  recordNextCursor,
} from "@/lib/pagination/cursor-pages";

// URL-driven paging for server cursor lists. The page lives on the path
// (`/page/N`) while the sequential pageState tokens live in an in-memory
// map: back/forward inside the session resolves every visited page, and
// a cold load on N>1 bounces to the list root because a mid-chain cursor
// cannot be reconstructed from the URL alone.
export function useCursorRoutePage() {
  const { page, basePath, hrefFor, firstPageHref } = useRoutePage();
  const router = useRouter();
  const [cursors, setCursors] = useState<CursorPages>(FIRST_PAGE_CURSORS);
  const cursor = cursorForPage(cursors, page);
  const known = isPageKnown(cursors, page);

  useEffect(() => {
    if (!known) router.replace(firstPageHref, { scroll: false });
  }, [known, firstPageHref, router]);

  // Call from the "next" link's onClick so the token lands before the URL
  // moves to page + 1.
  const recordNext = useCallback(
    (nextCursor: string) =>
      setCursors((prev) => recordNextCursor(prev, page, nextCursor)),
    [page],
  );
  // Filter/tab/search changes drop the recorded chain; callers in event
  // handlers or effects should also router.replace(firstPageHref) when the
  // URL still sits on a deep page. Render-phase resets (tab diff) only
  // need this — the new tab's URL carries no page segment already.
  const reset = useCallback(() => setCursors(FIRST_PAGE_CURSORS), []);

  return {
    page,
    basePath,
    hrefFor,
    firstPageHref,
    cursor: cursor ?? null,
    known,
    recordNext,
    reset,
  };
}
