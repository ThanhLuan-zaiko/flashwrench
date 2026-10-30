"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import { swatchClass } from "@/components/charts/chart-palette";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import {
  ChartHeadline,
  StaffChartCard,
} from "@/components/charts/StaffChartCard";
import { useMechanicIncome } from "@/hooks/mechanic";
import {
  groupTotals,
  receivedByDay,
  shortDay,
} from "@/lib/staff-charts/page-series";
import { formatVnd } from "../mechanic-format";

const METHOD_LABELS: Record<string, string> = {
  cod: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
};

// Money received per day over 30 days plus the cash / transfer split.
// Reuses the income query, so a recorded payment redraws in place.
export function IncomeTrendChart() {
  const query = useMechanicIncome();
  const entries = query.data?.entries ?? [];
  const now = new Date();
  const days = receivedByDay(entries, now);
  const total = days.reduce((sum, point) => sum + point.value, 0);
  const methods = groupTotals(
    entries.filter((entry) => entry.received > 0),
    (entry) => entry.method || "other",
    (entry) => METHOD_LABELS[entry.method] ?? "Khác",
    (entry) => entry.received,
  );

  return (
    <StaffChartCard
      title="Tiền đã nhận 30 ngày"
      subtitle={
        query.data?.truncated
          ? "Theo ngày ghi nhận · danh sách đã giới hạn"
          : "Theo ngày ghi nhận"
      }
      isPending={query.isPending}
      empty={query.isError ? "Không tải được thu nhập." : null}
      aside={<ChartHeadline value={formatVnd(total)} caption="trong 30 ngày" />}
    >
      <AreaChart
        values={days.map((point) => point.value)}
        labels={days.map((point) => shortDay(point.day))}
        markLast
        label={`Tiền đã nhận 30 ngày gần nhất: ${formatVnd(total)}`}
        className="h-44 w-full"
      />
      {methods.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <StackedBarChart
            values={methods.map((method) => method.value)}
            label={methods
              .map((method) => `${method.label}: ${formatVnd(method.value)}`)
              .join("; ")}
            className="h-4 w-full sm:max-w-xs"
          />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-700 dark:text-zinc-300">
            {methods.map((method, index) => (
              <li key={method.key} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-sm ${swatchClass(index)}`}
                />
                {method.label}
                <b className="tabular-nums">{formatVnd(method.value)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </StaffChartCard>
  );
}
