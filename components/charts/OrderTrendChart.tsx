"use client";

import { formatVnd } from "@/components/revenue/revenue-format";
import { useOrderTrend } from "@/hooks/page-charts";
import { shortDay } from "@/lib/staff-charts/page-series";
import { AreaChart } from "./AreaChart";
import { ChartHeadline, StaffChartCard } from "./StaffChartCard";

type OrderTrendChartProps = {
  /** Dispatch watches order counts; admin watches order value. */
  metric: "count" | "value";
};

// Parts orders per day over two weeks, shared by the dispatch and admin
// order screens. Refetches on the operations feed.
export function OrderTrendChart({ metric }: OrderTrendChartProps) {
  const trend = useOrderTrend();
  const points = trend.data?.points ?? [];
  const values = points.map((p) => (metric === "count" ? p.count : p.value));
  const total = values.reduce((sum, value) => sum + value, 0);
  const headline = metric === "count" ? `${total} đơn` : formatVnd(total);

  return (
    <StaffChartCard
      title={
        metric === "count" ? "Đơn linh kiện theo ngày" : "Giá trị đơn theo ngày"
      }
      subtitle={
        trend.data?.truncated
          ? "14 ngày gần nhất · số liệu một phần"
          : "14 ngày gần nhất"
      }
      isPending={trend.isPending}
      empty={trend.isError ? "Không tải được thống kê đơn hàng." : null}
      aside={<ChartHeadline value={headline} caption="trong 14 ngày" />}
    >
      <AreaChart
        values={values}
        labels={points.map((p) => shortDay(p.day))}
        formatY={metric === "count" ? (v) => String(Math.round(v)) : undefined}
        markLast
        label={`${metric === "count" ? "Số đơn" : "Giá trị đơn"} 14 ngày gần nhất: tổng ${headline}`}
        className="h-44 w-full"
      />
    </StaffChartCard>
  );
}
