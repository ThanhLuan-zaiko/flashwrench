import { Sparkline } from "@/components/charts/Sparkline";
import { formatVnd } from "@/components/revenue/revenue-format";
import type { DispatchPulse } from "@/lib/dispatch/dispatch-pulse.types";
import { changeVsYesterday } from "./pulse-format";

type Kpi = {
  label: string;
  value: string;
  delta: string | null;
  negative?: boolean;
  spark: number[] | null;
};

function signed(percent: number | null): string | null {
  if (percent === null) return null;
  const rounded = Math.round(percent);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

// Cumulative running total — a smoother sparkline than raw hourly counts.
function running(values: readonly number[]): number[] {
  let total = 0;
  return values.map((value) => {
    total += value;
    return total;
  });
}

function buildKpis(pulse: DispatchPulse): Kpi[] {
  const stage = (id: string) =>
    pulse.funnel.find((step) => step.stage === id)?.count ?? 0;
  const openRescues = pulse.rescues.reduce((sum, step) => sum + step.count, 0);
  const waiting = pulse.rescues.find((s) => s.stage === "waiting")?.count ?? 0;
  const bookingDelta = changeVsYesterday(pulse.today, pulse.yesterday);
  return [
    {
      label: "Đơn hôm nay",
      value: String(pulse.todayTotal),
      delta: signed(bookingDelta),
      negative: (bookingDelta ?? 0) < 0,
      spark: running(pulse.today),
    },
    {
      label: "Đang sửa",
      value: String(stage("working")),
      delta: `${stage("assigned")} chờ thợ tới`,
      spark: null,
    },
    {
      label: "Cứu hộ mở",
      value: String(openRescues),
      delta: waiting > 0 ? `${waiting} chờ thợ nhận` : "Không ca nào chờ",
      negative: waiting > 0,
      spark: null,
    },
    {
      label: "Doanh thu hôm nay",
      value: pulse.revenue ? formatVnd(pulse.revenue.collected) : "—",
      delta: signed(pulse.revenue?.percent ?? null),
      negative: (pulse.revenue?.percent ?? 0) < 0,
      spark: pulse.revenue ? running(pulse.revenue.series) : null,
    },
  ];
}

// Four headline tiles; trend lines only where the API has a series.
export function PulseKpiRow({ pulse }: { pulse: DispatchPulse }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-3.5 lg:grid-cols-4">
      {buildKpis(pulse).map((kpi, index) => (
        <div
          key={kpi.label}
          className="flex flex-col gap-1.5 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <p className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">
            {kpi.label}
          </p>
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#1E3A5F] tabular-nums sm:text-3xl dark:text-zinc-50">
              {kpi.value}
            </span>
            {kpi.delta && (
              <span
                className={`rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-bold dark:border-zinc-800 ${
                  kpi.negative
                    ? "text-red-600 dark:text-red-400"
                    : "text-[#1E3A5F] dark:text-zinc-200"
                }`}
              >
                {kpi.delta}
              </span>
            )}
          </p>
          {kpi.spark && kpi.spark.length > 1 ? (
            <Sparkline values={kpi.spark} seriesIndex={index} />
          ) : (
            <span aria-hidden="true" className="block h-9" />
          )}
        </div>
      ))}
    </div>
  );
}
