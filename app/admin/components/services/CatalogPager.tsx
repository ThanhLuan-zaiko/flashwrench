"use client";

import { type FormEvent, useId, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { pageWindow, parsePageInput } from "./catalog-pagination";

type CatalogPagerProps = {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  onPage: (page: number) => void;
};

// Shared pager for admin lists. Always renders the range label plus
// numbered buttons so short lists still show "Trang 1 / 1" for easy
// scanning. Long lists collapse into a window with ellipsis plus a
// jump box. Buttons keep the 44px minimum touch target.
export function CatalogPager({
  page,
  pageCount,
  start,
  end,
  total,
  onPage,
}: CatalogPagerProps) {
  const safeCount = Number.isInteger(pageCount) ? Math.max(1, pageCount) : 1;
  const current = Number.isInteger(page)
    ? Math.min(Math.max(0, page), safeCount - 1)
    : 0;
  const tokens = pageWindow(current, safeCount);
  const prevDisabled = current <= 0;
  const nextDisabled = current >= safeCount - 1;
  const jumpId = useId();
  const [jump, setJump] = useState("");
  let gapSeen = 0;

  const submitJump = (event: FormEvent) => {
    event.preventDefault();
    const target = parsePageInput(jump, safeCount);
    if (target === null || target === current) return;
    onPage(target);
    setJump("");
  };

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
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={prevDisabled}
          onClick={() => onPage(current - 1)}
          aria-label="Trang trước"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        {tokens.map((token) => {
          if (token === "ellipsis") {
            const key = gapSeen === 0 ? "gap-start" : "gap-end";
            gapSeen += 1;
            return (
              <span
                key={key}
                aria-hidden="true"
                className="px-1 text-xs text-zinc-400 dark:text-zinc-500"
              >
                …
              </span>
            );
          }
          return (
            <button
              key={token}
              type="button"
              disabled={token === current}
              onClick={() => onPage(token)}
              aria-label={`Trang ${token + 1}`}
              aria-current={token === current ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] ${
                token === current
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {token + 1}
            </button>
          );
        })}
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => onPage(current + 1)}
          aria-label="Trang sau"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FiChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <span className="w-full px-1 text-xs font-semibold text-zinc-700 sm:w-auto dark:text-zinc-300">
        Trang {current + 1} / {safeCount}
      </span>
      {safeCount > 7 && (
        <form
          onSubmit={submitJump}
          aria-label="Nhảy tới trang"
          className="flex w-full items-center gap-1.5 sm:w-auto"
        >
          <label htmlFor={jumpId} className="sr-only">
            Nhập số trang cần đến
          </label>
          <input
            id={jumpId}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            inputMode="numeric"
            placeholder={`1–${safeCount}`}
            className="h-11 w-20 rounded-xl border border-zinc-300 bg-white px-3 text-center text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            aria-label="Đi tới trang đã nhập"
            className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Đi
          </button>
        </form>
      )}
    </nav>
  );
}
