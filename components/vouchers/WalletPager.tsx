"use client";

import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { scrollToPageTop } from "@/components/pagination/scroll-to-page-top";

type WalletPagerProps = {
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
  "flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] disabled:cursor-not-allowed disabled:text-zinc-400 motion-safe:active:scale-[0.99] dark:text-blue-300 dark:focus-visible:ring-zinc-100 dark:disabled:text-zinc-600";

// Cursor pager over sequential pageState tokens: "Sau" is a real /page/N
// link whose click records the token, so back/forward and copied URLs all
// land on the same page chain. Hidden when nothing can move.
export function WalletPager({
  page,
  count,
  canBack,
  canNext,
  loading,
  backHref,
  nextHref,
  onNextClick,
}: WalletPagerProps) {
  if (!canBack && !canNext) return null;
  return (
    <nav
      aria-label="Phân trang ví voucher"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
    >
      <p
        aria-live="polite"
        className="text-xs text-zinc-600 dark:text-zinc-400"
      >
        Trang {page} · Hiển thị {count} voucher
        {canNext ? " · còn voucher tiếp theo" : ""}
      </p>
      <div className="flex items-center gap-5">
        {canBack && !loading ? (
          <Link
            href={backHref}
            scroll={false}
            onClick={scrollToPageTop}
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
            onClick={(event) => {
              scrollToPageTop(event);
              onNextClick();
            }}
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
