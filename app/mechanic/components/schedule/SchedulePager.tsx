"use client";

import Link from "next/link";

type SchedulePagerProps = {
  page: number;
  pageCount: number;
  range: { start: number; end: number };
  total: number;
  hrefFor: (page: number) => string;
};

// Numbered pager for the work queue: every page is a /page/N link and the
// parent canonicalizes over-large numbers. Buttons keep the 44px minimum
// touch target.
export function SchedulePager({
  page,
  pageCount,
  range,
  total,
  hrefFor,
}: SchedulePagerProps) {
  const pages = Array.from({ length: pageCount }, (_, index) => index);
  return (
    <nav
      aria-label="Phân trang đơn hàng"
      className="flex flex-wrap items-center justify-between gap-2 pt-3"
    >
      <p
        aria-live="polite"
        className="text-xs text-zinc-500 dark:text-zinc-400"
      >
        Hiển thị {range.start}–{range.end} trên {total} đơn
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {pages.map((index) =>
          index === page ? (
            <button
              key={index}
              type="button"
              disabled
              aria-label={`Trang ${index + 1}`}
              aria-current="page"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:border-white dark:bg-white dark:text-zinc-900"
            >
              {index + 1}
            </button>
          ) : (
            <Link
              key={index}
              href={hrefFor(index)}
              scroll={false}
              prefetch
              aria-label={`Trang ${index + 1}`}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {index + 1}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
