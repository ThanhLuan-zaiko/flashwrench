"use client";

import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { type AreaChartOptions, drawAreaChart } from "./chart-draw-lines";
import { resolveChartTheme } from "./chart-palette";

type AreaChartProps = AreaChartOptions & {
  values: readonly number[];
  /** Accessible summary; the canvas itself is invisible to screen readers. */
  label: string;
  className?: string;
};

// Live area trend on canvas; realtime refetches morph the line via GSAP.
export function AreaChart({
  values,
  label,
  className = "h-48 w-full sm:h-56",
  ...options
}: AreaChartProps) {
  const canvasRef = useTweenedCanvas(
    [...values, ...(options.compare ?? [])],
    (ctx, w, h, tweened, reveal) =>
      drawAreaChart(
        ctx,
        w,
        h,
        tweened.slice(0, values.length),
        reveal,
        resolveChartTheme(),
        { ...options, compare: tweened.slice(values.length) },
      ),
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
