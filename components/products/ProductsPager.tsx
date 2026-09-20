"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type ProductsPagerProps = {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  onChange: (page: number) => void;
};

const BUTTON_CLASSES =
  "flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

// Numeric summary + prev/next for the public products shelf.
export function ProductsPager({
  page,
  pageCount,
  start,
  end,
  total,
  onChange,
}: ProductsPagerProps) {
  if (total === 0) return null;
  return (
    <nav
      data-reveal
      aria-label="Phân trang sản phẩm"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Hiển thị{" "}
        <span className="font-semibold">
          {start}–{end}
        </span>{" "}
        trong <span className="font-semibold">{total}</span> sản phẩm
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
          className={BUTTON_CLASSES}
        >
          <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
          Trước
        </button>
        <span className="px-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {page + 1}/{pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onChange(page + 1)}
          className={BUTTON_CLASSES}
        >
          Sau
          <FiChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
