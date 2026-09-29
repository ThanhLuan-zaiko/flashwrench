"use client";

import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type DispatchPagerProps = {
  page: number;
  count: number;
  canBack: boolean;
  canNext: boolean;
  loading: boolean;
  backHref: string;
  nextHref: string;
  // Records the just-fetched pageState token right before the "next"
  // navigation so the target page stays reachable inside this session.
  onNextClick: () => void;
};

const BUTTON_CLASS =
  "flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

// Cursor pager over sequential pageState tokens: "Sau" is a real /page/N
// link whose click records the token, so back/forward and copied URLs all
// land on the same page chain. Hidden when nothing can move.
export function DispatchPager({
  page,
  count,
  canBack,
  canNext,
  loading,
  backHref,
  nextHref,
  onNextClick,
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
        {canBack && !loading ? (
          <Link
            href={backHref}
            scroll={false}
            prefetch
            aria-label="Trang trước"
            className={BUTTON_CLASS}
          >
            <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-label="Trang trước"
            className={BUTTON_CLASS}
          >
            <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
            Trước
          </button>
        )}
        {canNext && !loading ? (
          <Link
            href={nextHref}
            scroll={false}
            prefetch
            onClick={onNextClick}
            aria-label="Trang sau"
            className={BUTTON_CLASS}
          >
            Sau
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-label="Trang sau"
            className={BUTTON_CLASS}
          >
            Sau
            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
