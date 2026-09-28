"use client";

import { useState } from "react";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { BentoCard } from "@/app/admin/components/bento/BentoCard";
import { StockPager } from "@/app/dispatch/components/stock/StockPager";
import {
  clampPage,
  pageSlice,
  stockPageCount,
} from "@/app/dispatch/components/stock/stock-pager";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { RevenueReport } from "@/lib/revenue/revenue.types";
import type { RevenueRange } from "@/lib/revenue/revenue-period";
import { RevenueKpiGrid } from "./RevenueKpiGrid";
import { RevenueMixChart } from "./RevenueMixChart";
import { RevenueRangeTabs } from "./RevenueRangeTabs";
import { RevenueToolbar } from "./RevenueToolbar";
import { RevenueTransactionsTable } from "./RevenueTransactionsTable";
import { RevenueTrendChart } from "./RevenueTrendChart";
import { todayAnchor } from "./revenue-format";

type RevenueBoardProps = {
  range: RevenueRange;
  basePath: string;
  anchor: string;
  onAnchorChange: (anchor: string) => void;
  csvHref: (anchor: string) => string;
  report: RevenueReport | undefined;
  isPending: boolean;
  isError: boolean;
  /** Admin: mechanic breakdown + fraud flags are included in the report. */
  staffSlices?: boolean;
};

// Shared revenue grid for the dispatcher and admin screens: hero trend,
// four KPIs, source/method mixes, paged transactions. The hook supplying
// `report` differs per role — presentation stays identical.
export function RevenueBoard({
  range,
  basePath,
  anchor,
  onAnchorChange,
  csvHref,
  report,
  isPending,
  isError,
  staffSlices = false,
}: RevenueBoardProps) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [prevRange, setPrevRange] = useState(range);
  const [page, setPage] = useState(1);
  if (prevRange !== range) {
    // Reset-on-prop-change: switching ranges re-anchors to today (via the
    // shell's onAnchorChange) and the transactions pager lands on page 1.
    setPrevRange(range);
    onAnchorChange(todayAnchor());
    setPage(1);
  }

  const txns = report?.transactions ?? [];
  const view = pageSlice(txns, page);
  const pages = stockPageCount(txns.length);

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RevenueRangeTabs basePath={basePath} active={range} />
      </div>

      {isPending && (
        <p
          aria-busy="true"
          className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-16 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải báo cáo…
        </p>
      )}

      {isError && (
        <p
          role="alert"
          className="flex items-center justify-center gap-2 rounded-2xl border border-red-300 bg-red-50 py-16 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <FiAlertCircle aria-hidden="true" className="h-4 w-4" />
          Không tải được báo cáo. Vui lòng thử lại.
        </p>
      )}

      {report && (
        <>
          <RevenueToolbar
            range={range}
            anchor={anchor}
            csvHref={csvHref(anchor)}
            onAnchorChange={(next) => {
              onAnchorChange(next);
              setPage(1);
            }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            <BentoCard
              label="Xu hướng doanh thu"
              className="sm:col-span-2 lg:row-span-2"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Xu hướng — {report.label}
              </p>
              <div className="mt-2">
                <RevenueTrendChart
                  points={report.series}
                  label={report.label}
                />
              </div>
            </BentoCard>
            <RevenueKpiGrid report={report} />
            <BentoCard label="Doanh thu theo nguồn" className="sm:col-span-2">
              <RevenueMixChart
                title="Theo nguồn"
                kind="source"
                slices={report.bySource}
                emptyHint="Chưa có giao dịch trong kỳ này."
              />
            </BentoCard>
            <BentoCard
              label="Doanh thu theo phương thức"
              className="sm:col-span-2"
            >
              <RevenueMixChart
                title="Theo phương thức"
                kind="method"
                slices={report.byMethod}
                emptyHint="Chưa có giao dịch trong kỳ này."
              />
            </BentoCard>
            {staffSlices && report.byMechanic && (
              <BentoCard
                label="Doanh thu theo thợ"
                className="sm:col-span-2 lg:col-span-4"
              >
                <RevenueMixChart
                  title="Theo thợ phụ trách"
                  kind="source"
                  slices={report.byMechanic}
                  emptyHint="Chưa có thợ nào ghi nhận thu tiền trong kỳ."
                />
              </BentoCard>
            )}
            <BentoCard
              label="Danh sách giao dịch"
              className="sm:col-span-2 lg:col-span-4"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Giao dịch — {report.label}
              </p>
              <div className="mt-2">
                <RevenueTransactionsTable
                  items={view.items}
                  truncated={report.truncated}
                  showStaff={staffSlices}
                />
              </div>
              <StockPager
                page={clampPage(page, txns.length)}
                totalPages={pages}
                from={view.from}
                to={view.to}
                total={txns.length}
                onPage={setPage}
              />
            </BentoCard>
          </div>
        </>
      )}
    </div>
  );
}
