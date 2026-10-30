"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import type { RevenuePoint } from "@/lib/revenue/revenue.types";

type RevenueTrendChartProps = {
  points: RevenuePoint[];
  label: string;
};

// Live area trend over the report series (canvas + GSAP). Collections on
// the operations feed refetch the report and the line morphs in place.
// The canvas is a11y-invisible, so the sibling <ul> lists every bucket.
export function RevenueTrendChart({ points, label }: RevenueTrendChartProps) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Chưa có giao dịch trong kỳ này.
      </p>
    );
  }

  return (
    <div>
      <AreaChart
        values={points.map((p) => p.amount)}
        labels={points.map((p) => p.label)}
        label={`Biểu đồ doanh thu ${label}`}
        markLast
      />
      <ul aria-label={`Số liệu doanh thu ${label}`} className="sr-only">
        {points.map((p) => (
          <li key={p.key}>
            {p.label}: {p.amount}đ, {p.count} giao dịch
          </li>
        ))}
      </ul>
    </div>
  );
}
