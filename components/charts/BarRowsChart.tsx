"use client";

import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { drawBarRows } from "./chart-draw-meters";
import { resolveChartTheme } from "./chart-palette";

type BarRowsChartProps = {
  values: readonly number[];
  label: string;
  className?: string;
};

// Stacked horizontal tracks, one per value; place the row labels in the
// DOM beside it at the same row height.
export function BarRowsChart({ values, label, className }: BarRowsChartProps) {
  const canvasRef = useTweenedCanvas(values, (ctx, w, h, tweened, reveal) =>
    drawBarRows(ctx, w, h, tweened, reveal, resolveChartTheme()),
  );
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={className}
    />
  );
}
