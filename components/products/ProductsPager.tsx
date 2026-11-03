"use client";

import Link from "next/link";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { scrollToPageTop } from "@/components/pagination/scroll-to-page-top";

type ProductsPagerProps = {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  hrefFor: (page: number) => string;
};

const LINK_CLASSES =
  "flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] motion-safe:active:scale-[0.99] dark:text-blue-300 dark:focus-visible:ring-zinc-100";

const IDLE_CLASSES =
  "flex min-h-11 items-center gap-1.5 text-sm font-bold text-zinc-400 dark:text-zinc-600";

// Ruled pager under the shelf: range summary, then bold text links with arrows.
// Pages are real links so every /page/N URL stays shareable. Hidden when the
// whole list fits on one page.
export function ProductsPager({
  page,
  pageCount,
  start,
  end,
  total,
  hrefFor,
}: ProductsPagerProps) {
  if (total === 0 || pageCount <= 1) return null;
  const hasPrev = page > 0;
  const hasNext = page < pageCount - 1;

  return (
    <nav
      aria-label="Phân trang sản phẩm"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
    >
      <p
        aria-live="polite"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        Hiển thị {start}–{end} trên {total} sản phẩm
      </p>
      <div className="flex items-center gap-5">
        {hasPrev ? (
          <Link
            href={hrefFor(page - 1)}
            scroll={false}
            onClick={scrollToPageTop}
            prefetch
            aria-label="Trang trước"
            className={LINK_CLASSES}
          >
            <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </Link>
        ) : (
          <span aria-disabled="true" className={IDLE_CLASSES}>
            <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </span>
        )}
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          Trang {page + 1} trên {pageCount}
        </p>
        {hasNext ? (
          <Link
            href={hrefFor(page + 1)}
            scroll={false}
            onClick={scrollToPageTop}
            prefetch
            aria-label="Trang sau"
            className={LINK_CLASSES}
          >
            Sau
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : (
          <span aria-disabled="true" className={IDLE_CLASSES}>
            Sau
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
