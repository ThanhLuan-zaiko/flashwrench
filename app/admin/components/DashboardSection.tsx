"use client";

import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { DashboardActivityCard } from "./bento/DashboardActivityCard";
import { DashboardAlertCard } from "./bento/DashboardAlertCard";
import { DashboardHeroCard } from "./bento/DashboardHeroCard";
import { DashboardStatCard } from "./bento/DashboardStatCard";
import { DASHBOARD_STATS } from "./bento/dashboard-stats";

// Grid root only: big type statement plus layout and reveal scope.
// Each card owns its content.
export function DashboardSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="FlashWrench · Quản trị"
        title="Vận hành trong tầm mắt."
        subtitle="Mọi lịch đặt, cứu hộ và thợ xe gói gọn trong một dashboard duy nhất."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <DashboardHeroCard />
        {DASHBOARD_STATS.map((stat) => (
          <DashboardStatCard key={stat.id} stat={stat} />
        ))}
        <DashboardActivityCard />
        <DashboardAlertCard />
      </div>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Số liệu sẽ hiển thị khi API thống kê vận hành được kết nối.
      </p>
    </div>
  );
}
