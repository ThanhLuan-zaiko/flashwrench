"use client";

import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useDispatchBookings } from "@/hooks/dispatch";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { FilterTabs } from "../../../mechanic/components/FilterTabs";
import { DispatchDetailDialog } from "./DispatchDetailDialog";
import { DispatchPager } from "./DispatchPager";
import { DispatchQueue } from "./DispatchQueue";
import {
  type CursorStack,
  canGoBack,
  canGoNext,
  currentCursor,
  FIRST_PAGE_STACK,
  pageNumber,
  popCursor,
  pushCursor,
} from "./dispatch-cursor";
import {
  DISPATCH_PAGE_SIZE,
  DISPATCH_STATUS_LABELS,
  formatMonthKey,
  isMonthKey,
  monthKeyNow,
} from "./dispatch-format";
import { DISPATCH_TABS, type DispatchTab } from "./dispatch-tabs";

// Bento root for the dispatch board: a hero card with the live filter
// context, a month picker (the API buckets by month), and the paged work
// queue. The active tab comes from the route; the cursor stack resets the
// moment the month changes, during render, so no stale page can linger.
export function DispatchBoard({ status }: { status: DispatchTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const toast = useToast();
  const [month, setMonth] = useState(monthKeyNow());
  const [appliedMonth, setAppliedMonth] = useState(month);
  const [stack, setStack] = useState<CursorStack>(FIRST_PAGE_STACK);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset-on-prop-change pattern: switching month restarts the cursor walk
  // synchronously, before the next paint, never in an effect.
  if (month !== appliedMonth) {
    setAppliedMonth(month);
    setStack(FIRST_PAGE_STACK);
  }

  const query = useDispatchBookings({
    status,
    month: appliedMonth,
    cursor: currentCursor(stack),
    limit: DISPATCH_PAGE_SIZE,
  });
  const items = query.data?.items ?? [];
  const nextCursor = query.data?.nextCursor ?? null;

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <BentoCard
          label="Bàn điều phối đơn hàng"
          className="sm:col-span-2 lg:col-span-2"
        >
          <h2 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
            Bàn điều phối đơn hàng
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Xem đơn theo trạng thái, xác nhận lịch hẹn, phân công thợ trực tuyến
            và hủy đơn khi khách yêu cầu.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
            />
            Đang xem: {DISPATCH_STATUS_LABELS[status]} ·{" "}
            {formatMonthKey(appliedMonth)}
          </p>
        </BentoCard>

        <BentoCard label="Bộ lọc tháng" className="sm:col-span-2 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="dispatch-month"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Tháng đặt lịch
              </label>
              <input
                id="dispatch-month"
                type="month"
                value={month}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isMonthKey(next)) setMonth(next);
                }}
                className="mt-2 flex min-h-[44px] w-full items-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:max-w-56 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Đơn được nhóm theo tháng hẹn sửa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiRefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${query.isFetching ? "motion-safe:animate-spin" : ""}`}
              />
              Tải lại
            </button>
          </div>
        </BentoCard>

        <BentoCard
          label="Hàng đợi điều phối"
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Hàng đợi điều phối
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {items.length} đơn trên trang này ·{" "}
                {formatMonthKey(appliedMonth)}
              </p>
            </div>
            <FilterTabs
              tabs={DISPATCH_TABS}
              activeId={status}
              ariaLabel="Lọc đơn theo trạng thái"
            />
          </div>
          <DispatchQueue
            isPending={query.isPending}
            isError={query.isError}
            filterLabel={DISPATCH_STATUS_LABELS[status]}
            items={items}
            onRetry={() => void query.refetch()}
            onOpen={setSelectedId}
          />
          <DispatchPager
            page={pageNumber(stack)}
            count={items.length}
            canBack={canGoBack(stack)}
            canNext={canGoNext(nextCursor)}
            loading={query.isFetching}
            onBack={() => setStack(popCursor)}
            onNext={() => {
              if (nextCursor) setStack((prev) => pushCursor(prev, nextCursor));
            }}
          />
        </BentoCard>
      </div>
      {selectedId && (
        <DispatchDetailDialog
          bookingId={selectedId}
          onClose={() => setSelectedId(null)}
          onToast={(variant, title, description) =>
            variant === "success"
              ? toast.success(title, description)
              : toast.error(title, description)
          }
        />
      )}
    </div>
  );
}
