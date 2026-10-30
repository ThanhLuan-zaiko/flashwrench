import { AreaChart } from "@/components/charts/AreaChart";
import { RevenueMixChart } from "@/components/revenue/RevenueMixChart";
import { formatVnd } from "@/components/revenue/revenue-format";
import type { RevenueReport } from "@/lib/revenue/revenue.types";
import { BentoCard } from "./BentoCard";

type DashboardChartsProps = {
  report: RevenueReport | undefined;
  isPending: boolean;
  isError: boolean;
};

function peakOf(report: RevenueReport) {
  return report.series.reduce(
    (best, point) => (point.amount > best.amount ? point : best),
    report.series[0] ?? { label: "—", amount: 0 },
  );
}

// Revenue trend for the selected range plus the split by source. A
// collection on the operations feed refetches the report and both
// canvases morph to the new numbers.
export function DashboardCharts({
  report,
  isPending,
  isError,
}: DashboardChartsProps) {
  const peak = report && report.series.length > 0 ? peakOf(report) : null;

  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
      <BentoCard
        label="Xu hướng doanh thu"
        tour="admin-dash-trend"
        className="lg:col-span-2"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
              Doanh thu
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {report?.label ?? "Đang tải kỳ báo cáo"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-[#1E3A5F] tabular-nums dark:text-zinc-50">
              {report ? formatVnd(report.collected) : "—"}
            </p>
            {peak && peak.amount > 0 && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Cao nhất {peak.label} · {formatVnd(peak.amount)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3">
          {isPending ? (
            <div className="h-56 rounded-xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900" />
          ) : report && report.series.length > 0 ? (
            <AreaChart
              values={report.series.map((point) => point.amount)}
              labels={report.series.map((point) => point.label)}
              label={`Biểu đồ doanh thu ${report.label}, tổng ${formatVnd(report.collected)}`}
              markLast
              className="h-56 w-full"
            />
          ) : (
            <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {isError
                ? "Không tải được doanh thu. Vui lòng thử lại sau."
                : "Chưa có giao dịch trong kỳ này."}
            </p>
          )}
        </div>
      </BentoCard>
      <BentoCard label="Cơ cấu doanh thu">
        <RevenueMixChart
          title="Cơ cấu doanh thu"
          kind="source"
          slices={report?.bySource ?? []}
          emptyHint="Chưa có giao dịch trong kỳ này."
        />
      </BentoCard>
    </div>
  );
}
