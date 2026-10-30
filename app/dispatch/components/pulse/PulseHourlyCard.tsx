import { AreaChart } from "@/components/charts/AreaChart";
import { swatchClass } from "@/components/charts/chart-palette";
import type { DispatchPulse } from "@/lib/dispatch/dispatch-pulse.types";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { changeVsYesterday, formatChange, hourLabels } from "./pulse-format";

// Bookings per scheduled hour today (solid, up to now) against yesterday
// (dashed, full day). The last point is ringed as "now".
export function PulseHourlyCard({ pulse }: { pulse: DispatchPulse }) {
  const change = changeVsYesterday(pulse.today, pulse.yesterday);
  const nowCount = pulse.today[pulse.today.length - 1] ?? 0;

  return (
    <BentoCard label="Đơn theo giờ" className="lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
            Đơn theo giờ
          </h3>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#1E3A5F] tabular-nums dark:text-zinc-50">
            {pulse.todayTotal} đơn
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {formatChange(change)} · {pulse.currentHour}h có {nowCount} đơn
          </p>
        </div>
        <div className="flex gap-4 text-xs text-zinc-700 dark:text-zinc-300">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1 w-4 rounded-full ${swatchClass(0)}`}
            />
            Hôm nay
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="w-4 border-t-2 border-dashed border-zinc-400"
            />
            Hôm qua ({pulse.yesterdayTotal})
          </span>
        </div>
      </div>
      <AreaChart
        values={pulse.today}
        compare={pulse.yesterday}
        labels={hourLabels()}
        formatY={(value) => String(Math.round(value))}
        markLast
        label={`Hôm nay ${pulse.todayTotal} đơn tính đến ${pulse.currentHour}h, hôm qua ${pulse.yesterdayTotal} đơn`}
        className="mt-3 h-52 w-full sm:h-60"
      />
    </BentoCard>
  );
}
