"use client";

import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { drawSparkline } from "./chart-draw-meters";
import { resolveChartTheme } from "./chart-palette";

type SparklineProps = {
  values: readonly number[];
  seriesIndex?: number;
  className?: string;
};

// Decorative KPI trend: the tile prints the real number, so the wrapper
// hides the canvas from assistive tech.
export function Sparkline({
  values,
  seriesIndex = 0,
  className = "h-9 w-full",
}: SparklineProps) {
  const canvasRef = useTweenedCanvas(values, (ctx, w, h, tweened, reveal) =>
    drawSparkline(ctx, w, h, tweened, reveal, resolveChartTheme(), seriesIndex),
  );
  return (
    <span aria-hidden="true" className={`block ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </span>
  );
}
