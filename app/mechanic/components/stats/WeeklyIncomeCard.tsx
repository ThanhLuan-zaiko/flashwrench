import { ColumnChart } from "@/components/charts/ColumnChart";
import type { MechanicDaily } from "@/lib/mechanic/mechanic-stats-daily";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatVnd } from "../mechanic-format";
import { compactMoney, weekChange, weekLabels } from "./stats-format";

// Seven days of income on canvas (GSAP). The dashed line is last week's
// daily average, so the bar for today grows past it as collections land.
export function WeeklyIncomeCard({ daily }: { daily: MechanicDaily }) {
  const reference = daily.previousWeekRevenue / 7;
  const labels = weekLabels(daily.week.map((point) => point.day));
  const summary = daily.week
    .map((point, index) => `${labels[index]}: ${formatVnd(point.revenue)}`)
    .join("; ");

  return (
    <BentoCard
      label="Thu nhập 7 ngày"
      tour="mech-stats-chart"
      className="lg:col-span-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
            Thu nhập 7 ngày
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Nét đứt là mức trung bình mỗi ngày của tuần trước
          </p>
        </div>
        <p className="text-[13px] text-zinc-700 dark:text-zinc-300">
          {weekChange(daily.weekRevenue, daily.previousWeekRevenue)}
        </p>
      </div>
      <ColumnChart
        values={daily.week.map((point) => point.revenue)}
        labels={labels}
        goal={reference > 0 ? reference : undefined}
        formatValue={compactMoney}
        highlightLast
        label={summary}
        className="mt-4 h-60 w-full"
      />
    </BentoCard>
  );
}
