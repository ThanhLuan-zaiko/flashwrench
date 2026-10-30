"use client";

import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { drawHeatmap, type HeatmapOptions } from "./chart-draw-heatmap";
import { resolveChartTheme } from "./chart-palette";

type HeatmapChartProps = HeatmapOptions & {
  values: readonly number[];
  label: string;
  className?: string;
};

// Week-column activity grid on canvas; a new completion deepens today's
// cell in place when the stats refetch.
export function HeatmapChart({
  values,
  label,
  className = "h-40 w-full",
  ...options
}: HeatmapChartProps) {
  const canvasRef = useTweenedCanvas(values, (ctx, w, h, tweened, reveal) =>
    drawHeatmap(ctx, w, h, tweened, reveal, resolveChartTheme(), options),
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
