"use client";

import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { type ColumnChartOptions, drawColumnChart } from "./chart-draw-shapes";
import { resolveChartTheme } from "./chart-palette";

type ColumnChartProps = ColumnChartOptions & {
  values: readonly number[];
  label: string;
  className?: string;
};

// Vertical bars on canvas with an optional goal line; bars cascade in on
// first paint and grow or shrink smoothly on realtime updates.
export function ColumnChart({
  values,
  label,
  className = "h-44 w-full",
  ...options
}: ColumnChartProps) {
  const canvasRef = useTweenedCanvas(values, (ctx, w, h, tweened, reveal) =>
    drawColumnChart(ctx, w, h, tweened, reveal, resolveChartTheme(), options),
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
