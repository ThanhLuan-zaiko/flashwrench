"use client";

import { useState } from "react";
import {
  CATALOG_PAGE_SIZE,
  clampPage,
  pageCountOf,
  pageRange,
  paginateItems,
} from "./catalog-pagination";

// Page state for one admin list. Callers reset on filter/tab change and
// render only slice(items). Clamping keeps the view valid after deletes.
export function usePagination(
  total: number,
  pageSize: number = CATALOG_PAGE_SIZE,
) {
  const [page, setPage] = useState(0);
  const current = clampPage(page, total, pageSize);

  return {
    page: current,
    pageCount: pageCountOf(total, pageSize),
    range: pageRange(current, total, pageSize),
    goTo: (next: number) => setPage(clampPage(next, total, pageSize)),
    reset: () => setPage(0),
    slice: <T>(items: T[]): T[] => paginateItems(items, current, pageSize),
  };
}
