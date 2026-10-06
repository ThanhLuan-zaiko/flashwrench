"use client";

import { useEffect } from "react";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { BentoCard } from "@/app/admin/components/bento/BentoCard";
import { RevenueRangeTabs } from "@/components/revenue/RevenueRangeTabs";
import { RevenueToolbar } from "@/components/revenue/RevenueToolbar";
import { todayAnchor } from "@/components/revenue/revenue-format";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type {
  CustomerMixReport,
  MixRange,
} from "@/lib/customer-mix/customer-mix.types";
import { CustomerMixChannelChart } from "./CustomerMixChannelChart";
import { CustomerMixKpis } from "./CustomerMixKpis";
import { CustomerMixSplitList } from "./CustomerMixSplitList";
import { MIX_RANGE_TABS } from "./customer-mix-format";

type CustomerMixBoardProps = {
  range: MixRange;
  basePath: string;
  anchor: string;
  onAnchorChange: (anchor: string) => void;
  report: CustomerMixReport | undefined;
  isPending: boolean;
  isError: boolean;
};

// Shared member-vs-guest board for the dispatcher and admin screens:
// channel trend, four KPIs, per-kind split, login trend. Same mount-once
// contract as the revenue board — the hook supplying `report` differs
// per role while presentation stays identical.
export function CustomerMixBoard({
  range,
  basePath,
  anchor,
  onAnchorChange,
  report,
  isPending,
  isError,
}: CustomerMixBoardProps) {
  const rootRef = useBentoReveal<HTMLDivElement>();

  // The parent's anchor lives in the shell, so re-anchoring to today on a
  // range switch must happen in an effect — calling it during render is a
  // cross-component setState violation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: todayAnchor is a pure formatter, not reactive state
  useEffect(() => {
    onAnchorChange(todayAnchor());
  }, [range, onAnchorChange]);

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RevenueRangeTabs
          basePath={basePath}
          active={range}
          tabs={MIX_RANGE_TABS}
          tour="mix-ranges"
        />
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
            onAnchorChange={onAnchorChange}
            tour="mix-toolbar"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            <BentoCard
              label="Đơn tạo theo kênh"
              tour="mix-channel"
              className="sm:col-span-2 lg:row-span-2"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Đơn tạo — {report.label}
              </p>
              <div className="mt-2">
                <CustomerMixChannelChart
                  points={report.orderSeries}
                  label={`đơn tạo ${report.label}`}
                  emptyHint="Chưa có đơn nào trong kỳ này."
                />
              </div>
            </BentoCard>
            <CustomerMixKpis report={report} tour="mix-kpis" />
            <BentoCard
              label="Đơn theo loại"
              tour="mix-split"
              className="sm:col-span-2"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Theo loại đơn — {report.label}
              </p>
              <div className="mt-2">
                <CustomerMixSplitList
                  slices={report.byKind}
                  emptyHint="Chưa có đơn nào trong kỳ này."
                />
              </div>
            </BentoCard>
            <BentoCard
              label="Đăng nhập theo kênh"
              tour="mix-login"
              className="sm:col-span-2"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Đăng nhập — {report.label}
              </p>
              <div className="mt-2">
                <CustomerMixChannelChart
                  points={report.loginSeries}
                  label={`đăng nhập ${report.label}`}
                  emptyHint="Chưa có lượt đăng nhập nào trong kỳ này."
                />
              </div>
              <p className="mt-2 border-t border-zinc-100 pt-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Đăng ký mới trong kỳ:{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {report.totals.memberSignups}
                </strong>{" "}
                tài khoản
              </p>
            </BentoCard>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Số liệu được ghi tại thời điểm tạo đơn và xác thực — chính xác tuyệt
            đối kể từ ngày triển khai bảng đếm, dữ liệu trước đó không khôi phục
            được. "Khách duy nhất" đếm theo tài khoản (thành viên) hoặc email đã
            xác minh (vãng lai); đơn bán tại quầy không gắn danh tính nên không
            nằm trong số khách duy nhất.
          </p>
        </>
      )}
    </div>
  );
}
