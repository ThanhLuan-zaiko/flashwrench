"use client";

import { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BRAND_CHIP_ACTIVE } from "@/components/ui/brand";
import {
  monthDays,
  monthKey,
  monthLabel,
  monthOf,
  shiftMonth,
  WEEKDAY_HEADERS,
} from "@/components/ui/date-time-dropdown.utils";

export const PICKER_NAV_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-xl text-zinc-900 transition-colors duration-150 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-100";
export const PICKER_CELL =
  "flex items-center justify-center rounded-xl border text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:focus-visible:ring-zinc-100";
export const PICKER_CELL_IDLE =
  "border-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800";
const CELL_OFF =
  "cursor-not-allowed border-transparent text-zinc-400 dark:text-zinc-600";

type CalendarGridProps = {
  /** Selected `YYYY-MM-DD`, or empty. */
  day: string;
  /** Limits for the month arrows; empty means no limit. */
  min?: string;
  max?: string;
  /** Whether a day can be picked; stable reference. */
  isOpen: (day: string) => boolean;
  onPick: (day: string) => void;
};

// Month header with arrows above a Monday-first day grid.
export function CalendarGrid({
  day: selected,
  min = "",
  max = "",
  isOpen,
  onPick,
}: CalendarGridProps) {
  const [view, setView] = useState(() => monthOf(selected || min, new Date()));
  const firstKey = min ? monthKey(monthOf(min, new Date())) : "";
  const lastKey = max ? monthKey(monthOf(max, new Date())) : "";
  const key = monthKey(view);

  const days = useMemo(
    () =>
      monthDays(view).map((day) => ({
        day,
        open: day ? isOpen(day) : false,
      })),
    [view, isOpen],
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Tháng trước"
          disabled={Boolean(firstKey) && key <= firstKey}
          onClick={() => setView((v) => shiftMonth(v, -1))}
          className={PICKER_NAV_BUTTON}
        >
          <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <p
          aria-live="polite"
          className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
        >
          {monthLabel(view)}
        </p>
        <button
          type="button"
          aria-label="Tháng sau"
          disabled={Boolean(lastKey) && key >= lastKey}
          onClick={() => setView((v) => shiftMonth(v, 1))}
          className={PICKER_NAV_BUTTON}
        >
          <FiChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {WEEKDAY_HEADERS.map((weekday) => (
          <span
            key={weekday}
            className="flex h-8 items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            {weekday}
          </span>
        ))}
        {days.map(({ day, open }, index) =>
          day ? (
            <button
              key={day}
              type="button"
              disabled={!open}
              aria-pressed={day === selected}
              aria-label={`Ngày ${day.slice(8)} tháng ${Number(day.slice(5, 7))}`}
              onClick={() => onPick(day)}
              className={`${PICKER_CELL} h-10 ${
                day === selected
                  ? BRAND_CHIP_ACTIVE
                  : open
                    ? PICKER_CELL_IDLE
                    : CELL_OFF
              }`}
            >
              {Number(day.slice(8))}
            </button>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: leading blanks never reorder.
            <span key={`blank-${index}`} aria-hidden="true" />
          ),
        )}
      </div>
    </>
  );
}
