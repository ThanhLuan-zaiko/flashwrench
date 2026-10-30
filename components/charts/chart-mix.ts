import { CHART_SERIES_LIGHT } from "./chart-palette";

const PALETTE_SIZE = CHART_SERIES_LIGHT.length;

// Folds a ranked slice list into at most one segment per palette hue: the
// first N-1 slices keep their own color, everything after shares the last
// ("Khác") so a long tail never repeats a hue for a different slice.
export function mixSegments(amounts: readonly number[]): number[] {
  if (amounts.length <= PALETTE_SIZE) return [...amounts];
  const head = amounts.slice(0, PALETTE_SIZE - 1);
  const tail = amounts
    .slice(PALETTE_SIZE - 1)
    .reduce((sum, amount) => sum + amount, 0);
  return [...head, tail];
}
