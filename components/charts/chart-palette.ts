// Approved chart palette for staff dashboards (AGENTS.md Section 6):
// navy, sky, teal, amber in that order. Navy disappears on the dark
// surface, so dark mode swaps the first series for zinc-200. Only canvas
// charts and their legend swatches may use these hues.

export const CHART_SERIES_LIGHT = [
  "#1E3A5F",
  "#0EA5E9",
  "#14B8A6",
  "#F59E0B",
] as const;
export const CHART_SERIES_DARK = [
  "#E4E4E7",
  "#38BDF8",
  "#2DD4BF",
  "#FBBF24",
] as const;
export const CHART_ALERT = { light: "#DC2626", dark: "#F87171" } as const;

// Legend swatches: same order as the canvas series, theme-aware.
export const CHART_SWATCH_CLASSES = [
  "bg-[#1E3A5F] dark:bg-zinc-200",
  "bg-[#0EA5E9] dark:bg-[#38BDF8]",
  "bg-[#14B8A6] dark:bg-[#2DD4BF]",
  "bg-[#F59E0B] dark:bg-[#FBBF24]",
] as const;

export type ChartTheme = {
  series: readonly string[];
  alert: string;
  ink: string;
  muted: string;
  grid: string;
  track: string;
  surface: string;
};

export function chartTheme(dark: boolean): ChartTheme {
  return dark
    ? {
        series: CHART_SERIES_DARK,
        alert: CHART_ALERT.dark,
        ink: "#FAFAFA",
        muted: "#A1A1AA",
        grid: "#27272A",
        track: "#27272A",
        surface: "#09090B",
      }
    : {
        series: CHART_SERIES_LIGHT,
        alert: CHART_ALERT.light,
        ink: "#18181B",
        muted: "#71717A",
        grid: "#F4F4F5",
        track: "#E4E4E7",
        surface: "#FFFFFF",
      };
}

// Reads the live theme from the `dark` class at draw time.
export function resolveChartTheme(): ChartTheme {
  return chartTheme(document.documentElement.classList.contains("dark"));
}

export function seriesColor(theme: ChartTheme, index: number): string {
  return theme.series[index % theme.series.length] as string;
}

export function swatchClass(index: number): string {
  return CHART_SWATCH_CLASSES[index % CHART_SWATCH_CLASSES.length] as string;
}

// `#RRGGBB` plus alpha → rgba() for soft area fills.
export function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
