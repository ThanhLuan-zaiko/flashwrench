// Pure canvas draw functions for revenue charts. Monochrome only: every
// color is resolved from the zinc scale at draw time via CSS variables so
// the same code renders both themes. Separated from the React component so
// the math is unit-testable without a DOM.
import type { RevenuePoint, RevenueSlice } from "@/lib/revenue/revenue.types";

export type ChartColors = {
  ink: string;
  muted: string;
  faint: string;
  line: string;
};

// Reads the live theme: zinc-900 fills on light, zinc-100 on dark.
export function resolveChartColors(): ChartColors {
  const dark = document.documentElement.classList.contains("dark");
  return dark
    ? { ink: "#fafafa", muted: "#a1a1aa", faint: "#3f3f46", line: "#e4e4e7" }
    : { ink: "#18181b", muted: "#71717a", faint: "#e4e4e7", line: "#27272a" };
}

const PAD = { top: 12, right: 4, bottom: 22, left: 4 };

/** Smallest 1/2/5-step ceiling at or above the value — shared axis math. */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const fraction = value / base;
  const rounded =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return rounded * base;
}

/** Compact VND axis label: 1.5tr / 800k / raw number under 1000. */
export function compactVnd(value: number): string {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (value >= 1_000)
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return String(Math.round(value));
}

// Animated area+line chart over the report's series points. Progress grows
// the drawn segment left-to-right; the area fill fades in behind it.
export function drawTrendChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  points: RevenuePoint[],
  colors: ChartColors,
): void {
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  if (innerW <= 0 || innerH <= 0) return;
  const max = niceCeil(Math.max(...points.map((p) => p.amount), 0));

  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  // Gridlines + Y labels at 0/50/100%.
  ctx.strokeStyle = colors.faint;
  ctx.fillStyle = colors.muted;
  ctx.lineWidth = 1;
  for (const ratio of [0, 0.5, 1]) {
    const y = PAD.top + innerH * (1 - ratio);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(width - PAD.right, y);
    ctx.stroke();
    ctx.fillText(compactVnd(max * ratio), PAD.left + 2, y - 3);
  }

  const n = points.length;
  if (n === 0) return;
  const xAt = (i: number) =>
    PAD.left + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const yAt = (v: number) => PAD.top + innerH * (1 - v / max);

  const upto = progress * (n - 1);
  const full = Math.floor(upto);
  const partial = upto - full;

  const drawPath = (closeArea: boolean) => {
    ctx.beginPath();
    if (closeArea) ctx.moveTo(xAt(0), PAD.top + innerH);
    else ctx.moveTo(xAt(0), yAt(points[0].amount));
    for (let i = 0; i <= Math.min(full, n - 1); i += 1) {
      ctx.lineTo(xAt(i), yAt(points[i].amount));
    }
    if (full < n - 1 && partial > 0) {
      const a = points[full];
      const b = points[full + 1];
      ctx.lineTo(
        xAt(full) + (xAt(full + 1) - xAt(full)) * partial,
        yAt(a.amount) + (yAt(b.amount) - yAt(a.amount)) * partial,
      );
    }
    if (closeArea) ctx.lineTo(xAt(Math.min(upto, n - 1)), PAD.top + innerH);
  };

  ctx.globalAlpha = 0.12;
  drawPath(true);
  ctx.closePath();
  ctx.fillStyle = colors.ink;
  ctx.fill();
  ctx.globalAlpha = 1;

  drawPath(false);
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Dots on fully revealed points.
  ctx.fillStyle = colors.ink;
  for (let i = 0; i <= Math.min(full, n - 1); i += 1) {
    ctx.beginPath();
    ctx.arc(xAt(i), yAt(points[i].amount), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // X labels: sparse ticks so 24 hour-points stay readable.
  const step = Math.max(1, Math.ceil(n / 6));
  ctx.fillStyle = colors.muted;
  for (let i = 0; i < n; i += step) {
    ctx.fillText(points[i].label, xAt(i) - 6, height - 6);
  }
}

// Horizontal share bars for slice lists (by source / method / mechanic).
// Progress sweeps bar widths left-to-right with a per-bar cascade.
export function drawMixBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  slices: RevenueSlice[],
  colors: ChartColors,
): void {
  const count = slices.length;
  if (count === 0) return;
  const rowH = height / count;
  const barH = Math.min(10, rowH * 0.4);
  const total = slices.reduce((sum, s) => sum + s.amount, 0) || 1;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  slices.forEach((slice, index) => {
    const y = index * rowH;
    const local = Math.min(1, Math.max(0, progress * count - index));
    const target = (width * slice.amount) / total;
    // Track
    ctx.fillStyle = colors.faint;
    ctx.beginPath();
    ctx.roundRect(0, y + rowH - barH - 4, width, barH, barH / 2);
    ctx.fill();
    // Value bar
    if (local > 0 && target > 0) {
      ctx.fillStyle = colors.ink;
      ctx.beginPath();
      ctx.roundRect(0, y + rowH - barH - 4, target * local, barH, barH / 2);
      ctx.fill();
    }
  });
}
