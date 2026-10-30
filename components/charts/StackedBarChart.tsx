"use client";

import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { drawStackedBar } from "./chart-draw-shapes";
import { resolveChartTheme } from "./chart-palette";

type StackedBarChartProps = {
  values: readonly number[];
  label: string;
  className?: string;
};

// Share-of-total bar; pair it with a legend that uses `swatchClass(i)`
// so the text rows carry the numbers.
export function StackedBarChart({
  values,
  label,
  className = "h-6 w-full",
}: StackedBarChartProps) {
  const canvasRef = useTweenedCanvas(values, (ctx, w, h, tweened, reveal) =>
    drawStackedBar(ctx, w, h, tweened, reveal, resolveChartTheme()),
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
