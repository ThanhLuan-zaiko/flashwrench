"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type CatalogPagerProps = {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  onPage: (page: number) => void;
};

// Shared pager for admin lists. Renders nothing on a single page so short
// lists stay clean. Buttons keep the 44px minimum touch target.
export function CatalogPager({
  page,
  pageCount,
  start,
  end,
  total,
  onPage,
}: CatalogPagerProps) {
  if (pageCount <= 1) return null;
  const prevDisabled = page <= 0;
  const nextDisabled = page >= pageCount - 1;

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-between gap-2 pt-1"
    >
      <p
        aria-live="polite"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        Hiển thị {start}–{end} trên {total} mục
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={prevDisabled}
          onClick={() => onPage(page - 1)}
          aria-label="Trang trước"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <span className="px-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Trang {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => onPage(page + 1)}
          aria-label="Trang sau"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FiChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
