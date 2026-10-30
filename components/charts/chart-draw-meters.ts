// Pure canvas draw functions for meters: horizontal bar rows, the
// half-circle gauge and the KPI sparkline. `reveal` (0 → 1) grows shapes on
// first paint; values arrive already tweened by useTweenedCanvas.
import type { ChartTheme } from "./chart-palette";
import { seriesColor } from "./chart-palette";

// One rounded track per value, stacked top to bottom; each row gets the
// next palette hue. Text labels live in the DOM next to the canvas.
export function drawBarRows(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
): void {
  const n = values.length;
  if (n === 0 || width <= 0 || height <= 0) return;
  const max = Math.max(1, ...values);
  const rowH = height / n;
  const barH = Math.min(12, rowH * 0.6);
  values.forEach((value, i) => {
    const y = rowH * i + (rowH - barH) / 2;
    ctx.fillStyle = theme.track;
    ctx.beginPath();
    ctx.roundRect(0, y, width, barH, barH / 2);
    ctx.fill();
    const local = Math.min(1, Math.max(0, reveal * 1.4 - (i / n) * 0.4));
    const w = (width * Math.max(0, value) * local) / max;
    if (w <= 0) return;
    ctx.fillStyle = seriesColor(theme, i);
    ctx.beginPath();
    ctx.roundRect(0, y, Math.max(w, barH), barH, barH / 2);
    ctx.fill();
  });
}

export type GaugeOptions = {
  max: number;
  /** Tick drawn across the arc; the fill turns red past it. */
  threshold: number;
};

// Half-circle gauge opening downward, value sweeping left to right.
export function drawGauge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
  options: GaugeOptions,
): void {
  const thickness = Math.max(10, Math.min(18, width / 14));
  const radius = Math.min(width / 2, height) - thickness / 2 - 2;
  if (radius <= 0) return;
  const cx = width / 2;
  const cy = height - 2;
  ctx.lineCap = "round";
  ctx.lineWidth = thickness;
  ctx.strokeStyle = theme.track;
  ctx.beginPath();
  ctx.arc(cx, cy - thickness / 2, radius, Math.PI, 2 * Math.PI);
  ctx.stroke();

  const value = values[0] ?? 0;
  const ratio = Math.min(1, Math.max(0, value / options.max)) * reveal;
  if (ratio > 0) {
    ctx.strokeStyle =
      value > options.threshold ? theme.alert : seriesColor(theme, 1);
    ctx.beginPath();
    ctx.arc(cx, cy - thickness / 2, radius, Math.PI, Math.PI + Math.PI * ratio);
    ctx.stroke();
  }

  const tick = Math.PI + Math.PI * Math.min(1, options.threshold / options.max);
  const inner = radius - thickness * 0.9;
  const outer = radius + thickness * 0.9;
  ctx.lineCap = "butt";
  ctx.lineWidth = 2;
  ctx.strokeStyle = theme.ink;
  ctx.beginPath();
  ctx.moveTo(
    cx + inner * Math.cos(tick),
    cy - thickness / 2 + inner * Math.sin(tick),
  );
  ctx.lineTo(
    cx + outer * Math.cos(tick),
    cy - thickness / 2 + outer * Math.sin(tick),
  );
  ctx.stroke();
}

// Tiny trend line for KPI tiles: no axes, auto-scaled to its own range,
// with a soft fill underneath.
export function drawSparkline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
  seriesIndex = 0,
): void {
  const n = values.length;
  if (n < 2 || width <= 0 || height <= 0) return;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (i: number) => 1 + ((width - 2) * i) / (n - 1);
  const y = (v: number) => 3 + (height - 6) * (1 - (v - min) / span);
  const upto = Math.max(1, Math.round(reveal * (n - 1)));
  const color = seriesColor(theme, seriesIndex);

  ctx.beginPath();
  ctx.moveTo(x(0), height);
  for (let i = 0; i <= upto; i += 1) ctx.lineTo(x(i), y(values[i] ?? 0));
  ctx.lineTo(x(upto), height);
  ctx.closePath();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  for (let i = 0; i <= upto; i += 1) {
    if (i === 0) ctx.moveTo(x(i), y(values[i] ?? 0));
    else ctx.lineTo(x(i), y(values[i] ?? 0));
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}
