"use client";

import { FiChevronLeft, FiChevronRight, FiDownload } from "react-icons/fi";
import type { RevenueRange } from "@/lib/revenue/revenue-period";
import { shiftAnchor, todayAnchor } from "./revenue-format";

type RevenueToolbarProps = {
  range: RevenueRange;
  anchor: string;
  /** CSV export URL; reports without a CSV endpoint omit the button. */
  csvHref?: string;
  onAnchorChange: (anchor: string) => void;
  /** Spotlight-tour anchor; renders as `data-tour` on the toolbar. */
  tour?: string;
};

const BUTTON_CLASSES =
  "flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-xl border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

// Period navigation + CSV export. Anchors are day keys (YYYY-MM-DD) — the
// server normalizes them into whichever range is active.
export function RevenueToolbar({
  range,
  anchor,
  csvHref,
  onAnchorChange,
  tour,
}: RevenueToolbarProps) {
  const isToday = anchor === todayAnchor();
  return (
    <div data-tour={tour} className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-label="Kỳ trước"
        className={BUTTON_CLASSES}
        onClick={() => onAnchorChange(shiftAnchor(range, anchor, -1))}
      >
        <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      <input
        type="date"
        aria-label="Chọn ngày trong kỳ"
        value={anchor}
        onChange={(event) => {
          if (event.target.value) onAnchorChange(event.target.value);
        }}
        className="min-h-[44px] rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <button
        type="button"
        aria-label="Kỳ sau"
        className={BUTTON_CLASSES}
        onClick={() => onAnchorChange(shiftAnchor(range, anchor, 1))}
      >
        <FiChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
      {!isToday && (
        <button
          type="button"
          className={BUTTON_CLASSES}
          onClick={() => onAnchorChange(todayAnchor())}
        >
          Về kỳ hiện tại
        </button>
      )}
      {csvHref && (
        <a
          href={csvHref}
          download
          className={`${BUTTON_CLASSES} ml-auto`}
          aria-label="Xuất báo cáo CSV"
        >
          <FiDownload aria-hidden="true" className="h-4 w-4" />
          Xuất CSV
        </a>
      )}
    </div>
  );
}
