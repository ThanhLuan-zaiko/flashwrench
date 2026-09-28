"use client";

import { useCanvasChart } from "@/hooks/useCanvasChart";
import type { RevenuePoint } from "@/lib/revenue/revenue.types";
import { drawTrendChart, resolveChartColors } from "./revenue-draw";

type RevenueTrendChartProps = {
  points: RevenuePoint[];
  label: string;
};

// Animated line/area trend over the report series. The canvas is a11y-
// invisible, so the sibling <ul> lists every bucket's amount as text.
export function RevenueTrendChart({ points, label }: RevenueTrendChartProps) {
  const signature = points.map((p) => `${p.key}:${p.amount}`).join("|");
  const canvasRef = useCanvasChart(
    (ctx, w, h, progress) =>
      drawTrendChart(ctx, w, h, progress, points, resolveChartColors()),
    [signature],
  );

  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Chưa có giao dịch trong kỳ này.
      </p>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Biểu đồ doanh thu ${label}`}
        className="h-44 w-full sm:h-52"
      />
      <ul aria-label={`Số liệu doanh thu ${label}`} className="sr-only">
        {points.map((p) => (
          <li key={p.key}>
            {p.label}: {p.amount}đ, {p.count} giao dịch
          </li>
        ))}
      </ul>
    </div>
  );
}
