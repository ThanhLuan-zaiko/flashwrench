import { Sparkline } from "@/components/charts/Sparkline";
import { formatVnd } from "@/components/revenue/revenue-format";
import type { RevenueReport } from "@/lib/revenue/revenue.types";
import type { AdminDashboard } from "@/services/admin.api";

type DashboardKpiRowProps = {
  report: RevenueReport | undefined;
  dashboard: AdminDashboard | undefined;
};

function signedPercent(percent: number | null | undefined): string | null {
  if (percent === null || percent === undefined) return null;
  const rounded = Math.round(percent * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${String(rounded).replace(".", ",")}%`;
}

// Four headline tiles: revenue and receipts follow the selected range with
// sparklines from the report series; bookings and mechanics are live.
export function DashboardKpiRow({ report, dashboard }: DashboardKpiRowProps) {
  const tiles = [
    {
      label: "Doanh thu",
      value: report ? formatVnd(report.collected) : "—",
      delta: signedPercent(report?.previous.percent),
      negative: (report?.previous.percent ?? 0) < 0,
      spark: report?.series.map((point) => point.amount) ?? null,
    },
    {
      label: "Giao dịch thu tiền",
      value: report ? String(report.receipts) : "—",
      delta: report ? `TB ${formatVnd(report.avgReceipt)}` : null,
      negative: false,
      spark: report?.series.map((point) => point.count) ?? null,
    },
    {
      label: "Đơn hẹn hôm nay",
      value: dashboard ? String(dashboard.todayBookings) : "—",
      delta: dashboard ? `${dashboard.openRescues} cứu hộ mở` : null,
      negative: (dashboard?.pendingRescues ?? 0) > 0,
      spark: null,
    },
    {
      label: "Thợ trực tuyến",
      value: dashboard ? String(dashboard.onlineMechanics) : "—",
      delta:
        dashboard && dashboard.failedConfirmations > 0
          ? `${dashboard.failedConfirmations} lần sai mã`
          : null,
      negative: true,
      spark: null,
    },
  ];

  return (
    <div
      data-tour="admin-dash-stats"
      className="grid grid-cols-2 gap-3 md:gap-3.5 lg:grid-cols-4"
    >
      {tiles.map((tile, index) => (
        <div
          key={tile.label}
          className="flex flex-col justify-between gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">
              {tile.label}
            </p>
            <p className="mt-1.5 truncate text-xl font-extrabold text-[#1E3A5F] tabular-nums sm:text-[28px] dark:text-zinc-50">
              {tile.value}
            </p>
            {tile.delta && (
              <span
                className={`mt-1.5 inline-block rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-bold dark:border-zinc-800 ${
                  tile.negative
                    ? "text-red-600 dark:text-red-400"
                    : "text-[#1E3A5F] dark:text-zinc-200"
                }`}
              >
                {tile.delta}
              </span>
            )}
          </div>
          {tile.spark && tile.spark.length > 1 && (
            <Sparkline
              values={tile.spark}
              seriesIndex={index}
              className="h-9 w-full shrink-0 max-sm:hidden"
            />
          )}
        </div>
      ))}
    </div>
  );
}
