import { HeatmapChart } from "@/components/charts/HeatmapChart";
import type { MechanicStatsPayload } from "@/lib/mechanic/mechanic-stats.service";
import { weekdayOf } from "@/lib/mechanic/mechanic-stats-daily";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatVnd } from "../mechanic-format";
import { WEEKDAY_LONG } from "./stats-format";

const LEGEND_CLASSES = [
  "bg-zinc-200 dark:bg-zinc-800",
  "bg-[#1E3A5F]/25 dark:bg-zinc-200/25",
  "bg-[#1E3A5F]/50 dark:bg-zinc-200/50",
  "bg-[#1E3A5F]/75 dark:bg-zinc-200/75",
  "bg-[#1E3A5F] dark:bg-zinc-200",
];

// 12-week completion heatmap plus four day-level facts beside it.
export function ActivityHeatmapCard({
  payload,
}: {
  payload: MechanicStatsPayload;
}) {
  const { daily, stats } = payload;
  const first = daily.heatmap[0]?.day;
  const total = daily.heatmap.reduce((sum, point) => sum + point.completed, 0);
  const facts = [
    { label: "Chuỗi ngày làm liên tiếp", value: `${daily.streak} ngày` },
    {
      label: "Ngày bận nhất",
      value:
        daily.busiestWeekday === null
          ? "—"
          : (WEEKDAY_LONG[daily.busiestWeekday] ?? "—"),
    },
    { label: "Đơn đang mở", value: String(stats.openJobs) },
    { label: "Doanh thu tháng", value: formatVnd(stats.revenueThisMonth) },
  ];

  return (
    <BentoCard label="Lịch làm việc 12 tuần" className="lg:col-span-3">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-2.5 lg:w-[360px]">
          <div>
            <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
              Lịch làm việc 12 tuần
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Mỗi ô một ngày · càng đậm càng nhiều đơn
            </p>
          </div>
          <HeatmapChart
            values={daily.heatmap.map((point) => point.completed)}
            startWeekday={first ? weekdayOf(first) : 0}
            label={`${total} đơn hoàn thành trong 12 tuần gần nhất`}
            className="h-36 w-full max-w-[360px]"
          />
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            Ít
            {LEGEND_CLASSES.map((className) => (
              <span
                key={className}
                aria-hidden="true"
                className={`h-3 w-3 rounded ${className}`}
              />
            ))}
            Nhiều
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 content-center gap-x-6 gap-y-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {fact.label}
              </p>
              <p className="mt-0.5 text-xl font-extrabold text-[#1E3A5F] sm:text-2xl dark:text-zinc-50">
                {fact.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </BentoCard>
  );
}
