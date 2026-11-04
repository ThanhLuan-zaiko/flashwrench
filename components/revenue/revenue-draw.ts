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

// Reads the live theme: [#18181B] fills on light, [#F4F4F5] on dark.
export function resolveChartColors(): ChartColors {
  const dark = document.documentElement.classList.contains("dark");
  return dark
    ? { ink: "#FAFAFA", muted: "#A1A1AA", faint: "#3F3F46", line: "#E4E4E7" }
    : { ink: "#18181B", muted: "#71717A", faint: "#E4E4E7", line: "#27272A" };
}
