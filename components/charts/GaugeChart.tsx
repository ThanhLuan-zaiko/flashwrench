"use client";

import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { drawGauge, type GaugeOptions } from "./chart-draw-meters";
import { resolveChartTheme } from "./chart-palette";

type GaugeChartProps = GaugeOptions & {
  value: number;
  label: string;
  className?: string;
};

// Half-circle gauge with a threshold tick; the arc turns red past it.
export function GaugeChart({
  value,
  label,
  className = "h-28 w-56",
  ...options
}: GaugeChartProps) {
  const canvasRef = useTweenedCanvas([value], (ctx, w, h, tweened, reveal) =>
    drawGauge(ctx, w, h, tweened, reveal, resolveChartTheme(), options),
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
