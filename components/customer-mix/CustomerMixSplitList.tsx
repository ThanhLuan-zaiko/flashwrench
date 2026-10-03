"use client";

import { resolveChartColors } from "@/components/revenue/revenue-draw";
import { useCanvasChart } from "@/hooks/useCanvasChart";
import type { MixKindSlice } from "@/lib/customer-mix/customer-mix.types";
import { drawSplitRows } from "./customer-mix-draw";
import { describeKindSlice } from "./customer-mix-format";

type CustomerMixSplitListProps = {
  slices: MixKindSlice[];
  emptyHint: string;
};

// One member-share bar per order kind, with text rows carrying the actual
// counts — the canvas stays decorative like the revenue mix chart.
export function CustomerMixSplitList({
  slices,
  emptyHint,
}: CustomerMixSplitListProps) {
  const canvasRef = useCanvasChart(
    (ctx, w, h, progress) =>
      drawSplitRows(ctx, w, h, progress, slices, resolveChartColors()),
    [slices.map((s) => `${s.kind}:${s.member}:${s.guest}`).join("|")],
  );

  const total = slices.reduce((sum, s) => sum + s.member + s.guest, 0);
  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {emptyHint}
      </p>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Biểu đồ tỷ trọng thành viên theo loại đơn"
        className="h-28 w-full"
      />
      <ul className="mt-2 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {slices.map((slice) => {
          const view = describeKindSlice(slice);
          return (
            <li
              key={slice.kind}
              className="flex items-center justify-between gap-3 py-2 text-xs"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-zinc-800 dark:text-zinc-200">
                  {view.label}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {view.counts}
                </span>
              </span>
              <span className="shrink-0 text-right font-semibold text-zinc-900 dark:text-zinc-50">
                {view.share}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
