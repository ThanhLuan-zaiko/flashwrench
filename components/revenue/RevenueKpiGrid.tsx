import type { IconType } from "react-icons";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiCreditCard,
  FiDollarSign,
  FiMinus,
  FiTrendingUp,
} from "react-icons/fi";
import { BentoCard } from "@/app/admin/components/bento/BentoCard";
import type { RevenueReport } from "@/lib/revenue/revenue.types";
import { formatDelta, formatVnd } from "./revenue-format";

type Kpi = {
  label: string;
  value: string;
  hint: string;
  icon: IconType;
};

// Four 1x1 stat cells: collected vs previous range, receipt count and the
// average ticket. Delta icon flips direction with the sign. `tour` anchors
// the first cell for the workspace spotlight tours.
export function RevenueKpiGrid({
  report,
  tour,
}: {
  report: RevenueReport;
  tour?: string;
}) {
  const delta = report.previous;
  const DeltaIcon =
    delta.percent === null
      ? FiMinus
      : delta.percent >= 0
        ? FiArrowUpRight
        : FiArrowDownRight;
  const kpis: Kpi[] = [
    {
      label: "Tổng thu",
      value: formatVnd(report.collected),
      hint: `Kỳ trước: ${formatVnd(delta.collected)}`,
      icon: FiDollarSign,
    },
    {
      label: "So với kỳ trước",
      value:
        delta.percent === null
          ? "—"
          : `${delta.percent > 0 ? "+" : ""}${delta.percent}%`,
      hint: formatDelta(delta.percent, delta.delta),
      icon: DeltaIcon,
    },
    {
      label: "Số giao dịch",
      value: String(report.receipts),
      hint: "Phiếu thu đã ghi nhận",
      icon: FiCreditCard,
    },
    {
      label: "Trung bình / giao dịch",
      value: formatVnd(report.avgReceipt),
      hint: report.label,
      icon: FiTrendingUp,
    },
  ];
  return (
    <>
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <BentoCard
            key={kpi.label}
            label={kpi.label}
            tour={index === 0 ? tour : undefined}
          >
            <p className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {kpi.label}
              </span>
            </p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {kpi.hint}
            </p>
          </BentoCard>
        );
      })}
    </>
  );
}
