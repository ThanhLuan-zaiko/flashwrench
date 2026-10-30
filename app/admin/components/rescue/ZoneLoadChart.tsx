"use client";

import { ColumnChart } from "@/components/charts/ColumnChart";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { useZoneLoad } from "@/hooks/page-charts";

const MAX_ZONES = 8;

// Open rescues per service zone, busiest first; the headline splits the
// requests still waiting for a mechanic from those already handled.
export function ZoneLoadChart() {
  const load = useZoneLoad();
  const items = (load.data?.items ?? []).slice(0, MAX_ZONES);
  const waiting = items.reduce((sum, item) => sum + item.waiting, 0);
  const active = items.reduce((sum, item) => sum + item.active, 0);

  return (
    <StaffChartCard
      title="Cứu hộ đang mở theo vùng"
      subtitle={`${waiting} chờ thợ nhận · ${active} đang xử lý`}
      isPending={load.isPending}
      empty={
        load.isError
          ? "Không tải được tải cứu hộ theo vùng."
          : items.length === 0
            ? "Chưa có vùng phục vụ nào."
            : null
      }
      aside={
        <ChartHeadline value={String(waiting + active)} caption="ca đang mở" />
      }
    >
      <ColumnChart
        values={items.map((item) => item.waiting + item.active)}
        labels={items.map((item) => item.name)}
        label={items
          .map(
            (item) =>
              `${item.name}: ${item.waiting} chờ, ${item.active} đang xử lý`,
          )
          .join("; ")}
        className="h-44 w-full"
      />
    </StaffChartCard>
  );
}
