"use client";

import { useCanvasChart } from "@/hooks/useCanvasChart";
import type { RevenueSlice } from "@/lib/revenue/revenue.types";
import { drawMixBars, resolveChartColors } from "./revenue-draw";
import { describeSlice } from "./revenue-format";

type RevenueMixChartProps = {
  title: string;
  kind: "source" | "method";
  slices: RevenueSlice[];
  emptyHint: string;
};

const MAX_ROWS = 6;

// Horizontal share bars (canvas) with a labeled row per slice — the text
// rows carry the numbers so the canvas stays decorative.
export function RevenueMixChart({
  title,
  kind,
  slices,
  emptyHint,
}: RevenueMixChartProps) {
  const visible = slices.slice(0, MAX_ROWS);
  const total = slices.reduce((sum, s) => sum + s.amount, 0);
  const signature = visible.map((s) => `${s.key}:${s.amount}`).join("|");
  const canvasRef = useCanvasChart(
    (ctx, w, h, progress) =>
      drawMixBars(ctx, w, h, progress, visible, resolveChartColors()),
    [signature],
  );

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
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Biểu đồ ${title}`}
            className="mt-3 h-28 w-full"
          />
          <ul className="mt-2 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {visible.map((slice) => {
              const view = describeSlice(kind, slice, total);
              return (
                <li
                  key={slice.key}
                  className="flex items-center justify-between gap-3 py-2 text-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-zinc-800 dark:text-zinc-200">
                      {view.label}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {view.count}
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
