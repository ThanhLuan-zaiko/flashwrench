import type { MechanicStatsPayload } from "@/lib/mechanic/mechanic-stats.service";
import { formatVnd } from "../mechanic-format";
import { weekChange } from "./stats-format";

// Four headline tiles from the approved design, all from real data.
export function MechanicKpiRow({ payload }: { payload: MechanicStatsPayload }) {
  const { stats, daily } = payload;
  const tiles = [
    {
      label: "Thu nhập tuần",
      value: formatVnd(daily.weekRevenue),
      sub: `Tuần trước ${formatVnd(daily.previousWeekRevenue)}`,
    },
    {
      label: "Đơn hoàn thành",
      value: String(daily.weekCompleted),
      sub: weekChange(daily.weekCompleted, daily.previousWeekCompleted),
    },
    {
      label: "Đánh giá TB",
      value:
        stats.ratingCount > 0
          ? stats.ratingAvg.toFixed(1).replace(".", ",")
          : "—",
      sub:
        stats.ratingCount > 0
          ? `${stats.ratingCount} lượt đánh giá`
          : "Chưa có đánh giá",
    },
    {
      label: "Tỉ lệ hoàn thành",
      value: `${stats.completionRate}%`,
      sub: `${stats.cancelledJobs + stats.noShowJobs} đơn huỷ hoặc vắng`,
    },
  ];

  return (
    <div
      data-tour="mech-stats-counters"
      className="grid grid-cols-2 gap-3 md:gap-3.5 lg:grid-cols-4"
    >
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">
            {tile.label}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#1E3A5F] tabular-nums sm:text-3xl dark:text-zinc-50">
            {tile.value}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}
