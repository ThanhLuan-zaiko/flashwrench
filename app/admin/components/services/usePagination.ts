"use client";

import { useRouter } from "next/navigation";
import { useCanonicalizePage, useRoutePage } from "@/hooks/useRoutePage";
import {
  CATALOG_PAGE_SIZE,
  clampPage,
  pageCountOf,
  pageRange,
  paginateItems,
} from "./catalog-pagination";

// Page state for one admin list, driven by the /page/N URL segment so
// every page is a shareable link. Callers reset on filter change (a
// replace to the list root) and render only slice(items). Clamping keeps
// the view valid after deletes; an over-large typed page canonicalizes
// back to the last real page once the list is known.
export function usePagination(
  total: number,
  pageSize: number = CATALOG_PAGE_SIZE,
) {
  const router = useRouter();
  const { page, basePath, hrefFor } = useRoutePage();
  const pageCount = pageCountOf(total, pageSize);
  // URL is 1-based; the slicing helpers work on a 0-based index.
  const current = clampPage(page - 1, total, pageSize);
  // The total is only trustworthy once items have loaded — the shared
  // canonicalizer bounces an over-large typed page to the last real one.
  useCanonicalizePage(total > 0 ? pageCount : Number.MAX_SAFE_INTEGER, true);

  return {
    page: current,
    pageCount,
    range: pageRange(current, total, pageSize),
    // Pager links take the 0-based index, the URL takes the 1-based page.
    hrefFor: (index: number) => hrefFor(index + 1),
    reset: () => {
      if (page > 1) router.replace(basePath, { scroll: false });
    },
    slice: <T>(items: T[]): T[] => paginateItems(items, current, pageSize),
  };
}
