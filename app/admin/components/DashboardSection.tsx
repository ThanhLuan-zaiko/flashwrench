"use client";

import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { formatVnd } from "@/components/revenue/revenue-format";
import {
  useAdminDashboard,
  useAdminDashboardRealtime,
} from "@/hooks/admin-dashboard";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { DashboardActivityCard } from "./bento/DashboardActivityCard";
import { DashboardAlertCard } from "./bento/DashboardAlertCard";
import { DashboardHeroCard } from "./bento/DashboardHeroCard";
import { DashboardStatCard } from "./bento/DashboardStatCard";
import { DASHBOARD_STATS } from "./bento/dashboard-stats";

// Grid root: big type statement plus layout and reveal scope. Stats come
// from the dashboard endpoint; each stat id maps to one counter.
export function DashboardSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const dashboard = useAdminDashboard();
  useAdminDashboardRealtime();
  const data = dashboard.data;

  const statValues: Record<string, string> = data
    ? {
        "bookings-today": String(data.todayBookings),
        "rescue-open": String(data.openRescues),
        "mechanics-online": String(data.onlineMechanics),
        "revenue-month": formatVnd(data.monthRevenue),
      }
    : {};

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="FlashWrench · Quản trị"
        title="Vận hành trong tầm mắt."
        subtitle="Mọi lịch đặt, cứu hộ và thợ xe gói gọn trong một dashboard duy nhất."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <DashboardHeroCard
          todayBookings={data?.todayBookings}
          openRescues={data?.openRescues}
          onlineMechanics={data?.onlineMechanics}
        />
        {DASHBOARD_STATS.map((stat, index) => (
          <DashboardStatCard
            key={stat.id}
            stat={stat}
            value={statValues[stat.id]}
            isPending={dashboard.isPending}
            tour={index === 0 ? "admin-dash-stats" : undefined}
          />
        ))}
        <DashboardActivityCard
          events={data?.events}
          isPending={dashboard.isPending}
          isError={dashboard.isError}
        />
        <DashboardAlertCard
          failedConfirmations={data?.failedConfirmations}
          pendingRescues={data?.pendingRescues}
          todayReceipts={data?.todayReceipts}
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
