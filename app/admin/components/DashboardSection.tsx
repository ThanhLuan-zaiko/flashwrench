"use client";

import { useState } from "react";
import {
  useAdminDashboard,
  useAdminDashboardRealtime,
} from "@/hooks/admin-dashboard";
import { useAdminRevenue, useRevenueRealtime } from "@/hooks/revenue";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { RevenueRange } from "@/lib/revenue/revenue-period";
import { DashboardActivityCard } from "./bento/DashboardActivityCard";
import { DashboardCharts } from "./bento/DashboardCharts";
import { DashboardKpiRow } from "./bento/DashboardKpiRow";
import { DashboardRangeTabs } from "./bento/DashboardRangeTabs";
import { DashboardTopMechanics } from "./bento/DashboardTopMechanics";

// Admin landing laid out like the approved design: header with the range
// switch, KPI row, revenue trend + mix, top mechanics + live activity.
// Both queries refresh from the operations feed, so every canvas morphs
// in place when a collection or booking change lands.
export function DashboardSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [range, setRange] = useState<RevenueRange>("month");
  const dashboard = useAdminDashboard();
  const revenue = useAdminRevenue({ range });
  useAdminDashboardRealtime();
  useRevenueRealtime();
  const report = revenue.data;

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div
        data-tour="admin-dash-hero"
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase dark:text-zinc-400">
            Quản trị · Toàn hệ thống
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1E3A5F] sm:text-[28px] dark:text-zinc-50">
            Dashboard tổng quan
          </h2>
        </div>
        <DashboardRangeTabs value={range} onChange={setRange} />
      </div>
      <DashboardKpiRow report={report} dashboard={dashboard.data} />
      <DashboardCharts
        report={report}
        isPending={revenue.isPending}
        isError={revenue.isError}
      />
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
        <DashboardTopMechanics
          slices={report?.byMechanic}
          mechanics={dashboard.data?.mechanics}
          rangeLabel={report?.label ?? "kỳ đang chọn"}
        />
        <DashboardActivityCard
          events={dashboard.data?.events}
          isPending={dashboard.isPending}
          isError={dashboard.isError}
        />
      </div>
      {dashboard.isError && (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Không tải được số liệu tổng quan. Vui lòng thử lại sau.
        </p>
      )}
    </div>
  );
}
