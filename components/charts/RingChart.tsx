"use client";

import type { ReactNode } from "react";
import { useTweenedCanvas } from "@/hooks/useTweenedCanvas";
import { drawRingChart, type RingChartOptions } from "./chart-draw-shapes";
import { resolveChartTheme } from "./chart-palette";

type RingChartProps = RingChartOptions & {
  value: number;
  label: string;
  /** Centered content (the number itself) rendered as real text. */
  children?: ReactNode;
  className?: string;
};

// Progress ring on canvas with its value printed in the middle as text.
export function RingChart({
  value,
  label,
  children,
  className = "h-32 w-32",
  ...options
}: RingChartProps) {
  const canvasRef = useTweenedCanvas([value], (ctx, w, h, tweened, reveal) =>
    drawRingChart(ctx, w, h, tweened, reveal, resolveChartTheme(), options),
  );
  return (
    <div className={`relative shrink-0 ${className}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="h-full w-full"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
