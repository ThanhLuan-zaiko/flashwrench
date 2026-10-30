// Pure chart math shared by every canvas draw function — no DOM, so it is
// unit-testable.

/** Smallest 1/2/5-step ceiling at or above the value — shared axis math. */
export function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
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

// Interpolates two series of possibly different lengths: missing points
// start from 0 so a growing series slides in instead of jumping.
export function lerpSeries(
  from: readonly number[],
  to: readonly number[],
  t: number,
): number[] {
  return to.map((target, index) => {
    const start = from[index] ?? 0;
    return start + (target - start) * t;
  });
}

// Every-nth label index so dense series keep readable axes.
export function labelStep(count: number, maxLabels = 6): number {
  if (count <= 0) return 1;
  return Math.max(1, Math.ceil(count / maxLabels));
}

// Share of each value in the total, safe for an all-zero list.
export function shares(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return values.map(() => 0);
  return values.map((value) => Math.max(0, value) / total);
}

/** Signature string that changes whenever the chart's data changes. */
export function seriesSignature(values: readonly number[]): string {
  return values.map((value) => value.toFixed(2)).join("|");
}
