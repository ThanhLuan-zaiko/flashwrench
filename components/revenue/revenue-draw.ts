// Monochrome chart colors for the customer-mix canvases, resolved from the
// zinc scale at draw time so the same code renders both themes. Revenue
// charts moved to the shared palette in components/charts.
export { compactVnd, niceCeil } from "@/components/charts/chart-math";

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
