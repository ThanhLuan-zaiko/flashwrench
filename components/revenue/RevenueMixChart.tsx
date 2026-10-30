"use client";

import { mixSegments } from "@/components/charts/chart-mix";
import { swatchClass } from "@/components/charts/chart-palette";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import type { RevenueSlice } from "@/lib/revenue/revenue.types";
import { describeSlice } from "./revenue-format";

type RevenueMixChartProps = {
  title: string;
  kind: "source" | "method";
  slices: RevenueSlice[];
  emptyHint: string;
};

const MAX_ROWS = 6;

// Share-of-total bar (canvas + GSAP) over a labeled legend: the first
// slices get their own palette hue, the tail shares the last one.
export function RevenueMixChart({
  title,
  kind,
  slices,
  emptyHint,
}: RevenueMixChartProps) {
  const visible = slices.slice(0, MAX_ROWS);
  const total = slices.reduce((sum, s) => sum + s.amount, 0);
  const segments = mixSegments(slices.map((s) => s.amount));

  return (
    <div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </p>
      {visible.length === 0 ? (
        <p className="mt-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {emptyHint}
        </p>
      ) : (
        <>
          <StackedBarChart
            values={segments}
            label={`Biểu đồ tỷ trọng ${title}`}
            className="mt-3 h-6 w-full"
          />
          <ul className="mt-2 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((slice, index) => {
              const view = describeSlice(kind, slice, total);
              return (
                <li
                  key={slice.key}
                  className="flex items-center justify-between gap-3 py-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 shrink-0 rounded-sm ${swatchClass(Math.min(index, segments.length - 1))}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-zinc-800 dark:text-zinc-200">
                        {view.label}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {view.count}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold text-zinc-900 dark:text-zinc-50">
                      {view.value}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {view.share}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
