"use client";

import { ColumnChart } from "@/components/charts/ColumnChart";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { useMechanicBookings } from "@/hooks/mechanic";
import { upcomingLoad } from "@/lib/staff-charts/page-series";
import { weekLabels } from "../stats/stats-format";

// Jobs per day for today and the six days after it. Reuses the schedule
// totals query (no status filter), which the mechanic topic refreshes.
export function ScheduleWeekChart() {
  const query = useMechanicBookings();
  const bookings = query.data?.bookings ?? [];
  const load = upcomingLoad(bookings, new Date());
  // weekLabels marks the LAST day as today; this series starts today.
  const labels = weekLabels([...load].reverse().map((p) => p.day)).reverse();
  const total = load.reduce((sum, point) => sum + point.value, 0);

  return (
    <StaffChartCard
      title="Lịch 7 ngày tới"
      subtitle="Số đơn hẹn mỗi ngày, tính cả hôm nay"
      isPending={query.isPending}
      empty={query.isError ? "Không tải được lịch làm việc." : null}
      aside={<ChartHeadline value={String(total)} caption="đơn sắp tới" />}
    >
      <ColumnChart
        values={load.map((point) => point.value)}
        labels={labels}
        label={load
          .map((point, index) => `${labels[index]}: ${point.value} đơn`)
          .join("; ")}
        className="h-40 w-full"
      />
    </StaffChartCard>
  );
}
