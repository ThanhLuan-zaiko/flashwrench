import { FiCheckCircle, FiStar, FiTool, FiTrendingUp } from "react-icons/fi";
import type { MechanicStats } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatVnd } from "../mechanic-format";

// The four headline counters: finished jobs, completion rate, average
// rating and month revenue.
export function StatsCounters({ stats }: { stats: MechanicStats }) {
  const cards = [
    {
      id: "completed",
      label: "Đơn hoàn thành",
      value: String(stats.completedJobs),
      hint: `${stats.completedThisMonth} đơn trong tháng này`,
      icon: FiCheckCircle,
    },
    {
      id: "rate",
      label: "Tỷ lệ hoàn thành",
      value: `${stats.completionRate}%`,
      hint: `${stats.cancelledJobs} hủy · ${stats.noShowJobs} khách vắng`,
      icon: FiTool,
    },
    {
      id: "rating",
      label: "Đánh giá trung bình",
      value:
        stats.ratingCount > 0 ? `${stats.ratingAvg.toFixed(1)}/5` : "Chưa có",
      hint:
        stats.ratingCount > 0
          ? `Từ ${stats.ratingCount} lượt đánh giá`
          : "Hoàn thành đơn để nhận đánh giá",
      icon: FiStar,
    },
    {
      id: "revenue",
      label: "Doanh thu",
      value: formatVnd(stats.revenueThisMonth),
      hint: `Tháng này · tổng ${formatVnd(stats.revenueTotal)}`,
      icon: FiTrendingUp,
    },
  ];

  return (
    <>
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <BentoCard key={stat.id} label={stat.label}>
            <p className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {stat.label}
              </span>
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {stat.hint}
            </p>
          </BentoCard>
        );
      })}
    </>
  );
}
