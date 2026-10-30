// Pure canvas draw function for the area trend chart. `reveal` (0 → 1)
// grows the line left to right on first paint; values arrive already
// tweened by useTweenedCanvas.
import { compactVnd, labelStep, niceCeil } from "./chart-math";
import type { ChartTheme } from "./chart-palette";
import { seriesColor, withAlpha } from "./chart-palette";

const PAD = { top: 14, right: 6, bottom: 22, left: 6 };

export type AreaChartOptions = {
  labels: readonly string[];
  /** Optional comparison series (e.g. previous period) drawn dashed. */
  compare?: readonly number[];
  seriesIndex?: number;
  formatY?: (value: number) => string;
  /** Marks the last point with a ring, for "now" on live series. */
  markLast?: boolean;
};

type Point = { x: number; y: number };

function traceUpTo(ctx: CanvasRenderingContext2D, pts: Point[], upto: number) {
  const full = Math.floor(upto);
  const partial = upto - full;
  ctx.moveTo(pts[0]?.x ?? 0, pts[0]?.y ?? 0);
  for (let i = 1; i <= Math.min(full, pts.length - 1); i += 1) {
    const p = pts[i] as Point;
    ctx.lineTo(p.x, p.y);
  }
  const a = pts[full];
  const b = pts[full + 1];
  if (a && b && partial > 0) {
    ctx.lineTo(a.x + (b.x - a.x) * partial, a.y + (b.y - a.y) * partial);
  }
}

export function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
  options: AreaChartOptions,
): void {
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const n = values.length;
  if (innerW <= 0 || innerH <= 0 || n === 0) return;
  const compare = options.compare ?? [];
  const max = niceCeil(Math.max(0, ...values, ...compare));
  const formatY = options.formatY ?? compactVnd;
  const color = seriesColor(theme, options.seriesIndex ?? 0);
  const slots = Math.max(n, compare.length);
  const xAt = (i: number) =>
    PAD.left + (slots === 1 ? innerW / 2 : (innerW * i) / (slots - 1));
  const yAt = (v: number) => PAD.top + innerH * (1 - v / max);

  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.lineWidth = 1;
  for (const ratio of [0, 0.5, 1]) {
    const y = PAD.top + innerH * (1 - ratio);
    ctx.strokeStyle = ratio === 0 ? theme.track : theme.grid;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(width - PAD.right, y);
    ctx.stroke();
    if (ratio > 0) {
      ctx.fillStyle = theme.muted;
      ctx.fillText(formatY(max * ratio), PAD.left + 2, y - 4);
    }
  }

  if (compare.length > 1) {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = theme.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    traceUpTo(
      ctx,
      compare.map((v, i) => ({ x: xAt(i), y: yAt(v) })),
      compare.length - 1,
    );
    ctx.stroke();
    ctx.restore();
  }

  const pts = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const upto = reveal * (n - 1);
  const endX = n === 1 ? xAt(0) : xAt(0) + (xAt(n - 1) - xAt(0)) * reveal;

  ctx.beginPath();
  traceUpTo(ctx, pts, upto);
  ctx.lineTo(endX, PAD.top + innerH);
  ctx.lineTo(xAt(0), PAD.top + innerH);
  ctx.closePath();
  const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + innerH);
  gradient.addColorStop(0, withAlpha(color, 0.22));
  gradient.addColorStop(1, withAlpha(color, 0.02));
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  traceUpTo(ctx, pts, upto);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  const last = pts[n - 1];
  if (options.markLast && last && reveal >= 1) {
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = theme.surface;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  const step = labelStep(options.labels.length);
  ctx.fillStyle = theme.muted;
  ctx.textAlign = "center";
  options.labels.forEach((label, i) => {
    if (i % step !== 0 && i !== options.labels.length - 1) return;
    const x = Math.min(width - 14, Math.max(14, xAt(i)));
    ctx.fillText(label, x, height - 6);
  });
  ctx.textAlign = "start";
}
