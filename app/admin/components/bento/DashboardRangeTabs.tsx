"use client";

import type { RevenueRange } from "@/lib/revenue/revenue-period";

const OPTIONS: { value: RevenueRange; label: string }[] = [
  { value: "day", label: "Ngày" },
  { value: "week", label: "Tuần" },
  { value: "month", label: "Tháng" },
];

type DashboardRangeTabsProps = {
  value: RevenueRange;
  onChange: (range: RevenueRange) => void;
};

// Segmented range switch for the dashboard trend card.
export function DashboardRangeTabs({
  value,
  onChange,
}: DashboardRangeTabsProps) {
  return (
    <fieldset className="m-0 flex gap-1 rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
      <legend className="sr-only">Khoảng thời gian doanh thu</legend>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-9 rounded-lg px-3 text-xs font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:focus-visible:ring-zinc-100 ${
              selected
                ? "bg-[#1E3A5F] text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
