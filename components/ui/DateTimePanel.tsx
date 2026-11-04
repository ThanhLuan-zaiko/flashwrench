"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { BRAND_CHIP_ACTIVE } from "@/components/ui/brand";
import {
  CalendarGrid,
  PICKER_CELL,
  PICKER_CELL_IDLE,
} from "@/components/ui/CalendarGrid";
import {
  scrollWithinBox,
  splitDateTime,
  withExtraTimes,
} from "@/components/ui/date-time-dropdown.utils";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";

type DateTimePanelProps = {
  value: string;
  min: string;
  max: string;
  timesFor: (day: string) => string[];
  onPickDay: (day: string) => void;
  onPickTime: (time: string) => void;
  /** Always stack the time list under the grid, for narrow form columns. */
  stacked?: boolean;
};

// Popup body: a month grid beside a time list, stacked on phones or whenever
// the field sits in a narrow column.
export function DateTimePanel({
  value,
  min,
  max,
  timesFor,
  onPickDay,
  onPickTime,
  stacked,
}: DateTimePanelProps) {
  const current = splitDateTime(value);
  const selectedTimeRef = useRef<HTMLButtonElement>(null);
  const isOpen = useCallback(
    (day: string) => timesFor(day).length > 0,
    [timesFor],
  );
  const times = useMemo(
    () =>
      current.day ? withExtraTimes(timesFor(current.day), current.time) : [],
    [current.day, current.time, timesFor],
  );

  useEffect(() => {
    scrollWithinBox(selectedTimeRef.current);
  }, []);

  return (
    <div className={`flex flex-col gap-3 ${stacked ? "" : "sm:flex-row"}`}>
      <div className="min-w-0 flex-1">
        <CalendarGrid
          day={current.day}
          min={min}
          max={max}
          isOpen={isOpen}
          onPick={onPickDay}
        />
      </div>

      <div
        className={`min-w-0 border-t border-zinc-200 pt-3 dark:border-zinc-800 ${stacked ? "" : "sm:w-24 sm:shrink-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3"}`}
      >
        <p className="flex h-10 items-center text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Giờ
        </p>
        {times.length === 0 ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Chọn ngày trước.
          </p>
        ) : (
          <div
            className={`relative mt-1 grid max-h-40 grid-cols-4 gap-1 overflow-y-auto ${stacked ? "" : "sm:max-h-[17rem] sm:grid-cols-1"} ${SCROLLBAR_CLASSES}`}
          >
            {times.map((time) => {
              const active = time === current.time;
              return (
                <button
                  key={time}
                  ref={active ? selectedTimeRef : undefined}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPickTime(time)}
                  className={`${PICKER_CELL} min-h-9 shrink-0 ${active ? BRAND_CHIP_ACTIVE : PICKER_CELL_IDLE}`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
