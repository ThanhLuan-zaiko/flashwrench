"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type DispatchPagerProps = {
  page: number;
  count: number;
  canBack: boolean;
  canNext: boolean;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
};

// Cursor pager: the API only exposes nextCursor, so the pager walks the
// cursor stack instead of numbered pages. Hidden when nothing can move.
export function DispatchPager({
  page,
  count,
  canBack,
  canNext,
  loading,
  onBack,
  onNext,
}: DispatchPagerProps) {
  if (!canBack && !canNext) return null;
  return (
    <nav
      aria-label="Phân trang đơn điều phối"
      className="flex flex-wrap items-center justify-between gap-2 pt-3"
    >
      <p
        aria-live="polite"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        Trang {page} · Hiển thị {count} đơn
        {canNext ? " · còn đơn tiếp theo" : ""}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canBack || loading}
          onClick={onBack}
          aria-label="Trang trước"
          className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
          Trước
        </button>
        <button
          type="button"
          disabled={!canNext || loading}
          onClick={onNext}
          aria-label="Trang sau"
          className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Sau
          <FiChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
