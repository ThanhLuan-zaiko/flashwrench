// Pure canvas draw functions for bar and ring charts. `reveal` (0 → 1)
// grows shapes on first paint; values arrive already tweened.
import { labelStep, niceCeil, shares } from "./chart-math";
import type { ChartTheme } from "./chart-palette";
import { seriesColor } from "./chart-palette";

export type ColumnChartOptions = {
  labels: readonly string[];
  /** Emphasizes the last column (current period) with the primary hue. */
  highlightLast?: boolean;
  /** Dashed target line across the plot. */
  goal?: number;
  formatValue?: (value: number) => string;
};

export function drawColumnChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
  options: ColumnChartOptions,
): void {
  const n = values.length;
  const top = 18;
  const bottom = 22;
  const innerH = height - top - bottom;
  if (n === 0 || width <= 0 || innerH <= 0) return;
  const max = niceCeil(Math.max(0, ...values, options.goal ?? 0));
  const slot = width / n;
  const barW = Math.min(44, slot * 0.6);
  const format = options.formatValue ?? ((v: number) => String(Math.round(v)));

  ctx.strokeStyle = theme.track;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top + innerH);
  ctx.lineTo(width, top + innerH);
  ctx.stroke();

  ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  values.forEach((value, i) => {
    // Cascade: each bar starts a little after the previous one.
    const local = Math.min(1, Math.max(0, reveal * 1.4 - (i / n) * 0.4));
    const h = (innerH * Math.max(0, value) * local) / max;
    const x = slot * i + (slot - barW) / 2;
    const current = options.highlightLast && i === n - 1;
    ctx.fillStyle = current ? seriesColor(theme, 1) : seriesColor(theme, 0);
    ctx.globalAlpha = current || !options.highlightLast ? 1 : 0.85;
    ctx.beginPath();
    ctx.roundRect(x, top + innerH - h, barW, h, [6, 6, 2, 2]);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (local >= 1) {
      ctx.fillStyle = theme.ink;
      ctx.fillText(format(value), x + barW / 2, top + innerH - h - 5);
    }
  });

  if (options.goal && options.goal > 0) {
    const y = top + innerH * (1 - options.goal / max);
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = theme.muted;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.restore();
  }

  const step = labelStep(n, 8);
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = theme.muted;
  options.labels.forEach((label, i) => {
    if (i % step === 0 || i === n - 1) {
      ctx.fillText(label, slot * i + slot / 2, height - 6);
    }
  });
  ctx.textAlign = "start";
}

// One full-width bar split into palette-colored segments by share.
export function drawStackedBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
): void {
  if (width <= 0 || height <= 0) return;
  const barH = Math.min(22, height);
  const y = (height - barH) / 2;
  ctx.fillStyle = theme.track;
  ctx.beginPath();
  ctx.roundRect(0, y, width, barH, barH / 2);
  ctx.fill();

  const parts = shares(values);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, y, width * reveal, barH, barH / 2);
  ctx.clip();
  let x = 0;
  parts.forEach((share, i) => {
    const w = width * share;
    if (w <= 0) return;
    ctx.fillStyle = seriesColor(theme, i);
    ctx.fillRect(x, y, w, barH);
    if (i > 0) {
      ctx.fillStyle = theme.surface;
      ctx.fillRect(x - 1, y, 2, barH);
    }
    x += w;
  });
  ctx.restore();
}

export type RingChartOptions = {
  max: number;
  seriesIndex?: number;
  /** Turns the arc red once the value passes this mark. */
  alertAbove?: number;
  thickness?: number;
};

// Progress ring around the canvas center; the start is 12 o'clock.
export function drawRingChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
  options: RingChartOptions,
): void {
  const value = values[0] ?? 0;
  const thickness = options.thickness ?? 12;
  const radius = Math.min(width, height) / 2 - thickness / 2 - 1;
  if (radius <= 0) return;
  const cx = width / 2;
  const cy = height / 2;
  const start = -Math.PI / 2;
  ctx.lineCap = "round";
  ctx.lineWidth = thickness;
  ctx.strokeStyle = theme.track;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  const ratio =
    options.max > 0 ? Math.min(1, Math.max(0, value / options.max)) : 0;
  if (ratio <= 0) return;
  const alert = options.alertAbove !== undefined && value > options.alertAbove;
  ctx.strokeStyle = alert
    ? theme.alert
    : seriesColor(theme, options.seriesIndex ?? 0);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, start + Math.PI * 2 * ratio * reveal);
  ctx.stroke();
}
