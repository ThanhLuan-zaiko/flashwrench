"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import { StaffEmptyState } from "@/components/staff/StaffEmptyState";
import { STAFF_ART } from "@/components/staff/staff-art";
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
      <StaffEmptyState
        art={STAFF_ART.coins}
        title="Chưa có giao dịch trong kỳ này"
        hint="Doanh thu xuất hiện khi có phiếu thu được ghi nhận."
      />
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
