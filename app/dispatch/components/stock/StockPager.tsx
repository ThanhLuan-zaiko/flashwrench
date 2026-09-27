"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { pageButtons } from "./stock-pager";

type StockPagerProps = {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
};

// Numbered pager for the stock list: jump straight to any page instead of
// walking cursors. Hidden entirely when everything fits on one page.
export function StockPager({
  page,
  totalPages,
  from,
  to,
  total,
  onPage,
}: StockPagerProps) {
  if (totalPages <= 1) return null;
  const buttons = pageButtons(page, totalPages);
  const base =
    "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98]";
  const idle = `${base} border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800`;
  const active = `${base} border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900`;
  const nav = `${idle} gap-1 disabled:cursor-not-allowed disabled:opacity-40`;

  return (
    <nav
      aria-label="Phân trang tồn kho"
      className="flex flex-wrap items-center justify-between gap-2 pt-3"
    >
      <p
        aria-live="polite"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        Trang {page}/{totalPages} · Hiển thị {from}–{to} / {total} mục
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Trang trước"
          className={nav}
        >
          <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
          Trước
        </button>
        {buttons.map((entry, index) =>
          entry === "ellipsis" ? (
            <span
              key={`ellipsis-${buttons[index + 1]}`}
              aria-hidden="true"
              className="px-1 text-xs text-zinc-400 dark:text-zinc-500"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPage(entry)}
              aria-label={`Trang ${entry}`}
              aria-current={entry === page ? "page" : undefined}
              className={entry === page ? active : idle}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Trang sau"
          className={nav}
        >
          Sau
          <FiChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
