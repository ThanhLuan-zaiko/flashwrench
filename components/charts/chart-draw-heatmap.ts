// Pure canvas draw function for the activity heatmap: one column per week,
// Monday on top, cell intensity from the day's count. Cells fade in from
// left to right on first paint.
import type { ChartTheme } from "./chart-palette";
import { seriesColor, withAlpha } from "./chart-palette";

export const HEATMAP_LEVELS = 4;

/** 0 for an empty day, then 1..HEATMAP_LEVELS relative to the busiest day. */
export function heatLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.max(1, Math.ceil((count / max) * HEATMAP_LEVELS));
}

/** Alpha used for each level so light and dark share one ramp. */
export function levelAlpha(level: number): number {
  return [0, 0.25, 0.5, 0.75, 1][level] ?? 1;
}

export type HeatmapOptions = {
  /** Monday-first weekday (0..6) of the first value. */
  startWeekday: number;
};

export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  values: readonly number[],
  reveal: number,
  theme: ChartTheme,
  options: HeatmapOptions,
): void {
  const rows = 7;
  const columns = Math.ceil((values.length + options.startWeekday) / rows);
  if (columns === 0 || width <= 0 || height <= 0) return;
  const gap = 4;
  const cell = Math.min(
    (width - gap * (columns - 1)) / columns,
    (height - gap * (rows - 1)) / rows,
  );
  const max = Math.max(0, ...values);
  const color = seriesColor(theme, 0);

  values.forEach((value, index) => {
    const slot = index + options.startWeekday;
    const column = Math.floor(slot / rows);
    const row = slot % rows;
    const local = Math.min(
      1,
      Math.max(0, reveal * 1.5 - (column / columns) * 0.5),
    );
    if (local <= 0) return;
    const level = heatLevel(value, max);
    ctx.globalAlpha = local;
    ctx.fillStyle =
      level === 0 ? theme.track : withAlpha(color, levelAlpha(level));
    ctx.beginPath();
    ctx.roundRect(
      column * (cell + gap),
      row * (cell + gap),
      cell,
      cell,
      cell / 4,
    );
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}
