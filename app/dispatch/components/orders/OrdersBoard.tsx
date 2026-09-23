"use client";

import { useState } from "react";
import { FiRefreshCw, FiShoppingBag } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import {
  useDispatchOrders,
  useDispatchOrdersRealtime,
} from "@/hooks/dispatch-orders";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import {
  type CursorStack,
  currentCursor,
  FIRST_PAGE_STACK,
} from "../bookings/dispatch-cursor";
import {
  DISPATCH_PAGE_SIZE,
  formatMonthKey,
  isMonthKey,
  monthKeyNow,
} from "../bookings/dispatch-format";
import { OrderOpsDialog } from "./OrderOpsDialog";
import { OrdersQueueCard } from "./OrdersQueueCard";
import { type DispatchOrderTab, ORDER_TAB_LABELS } from "./order-tabs";
import { PosSaleDialog } from "./PosSaleDialog";
import { StockPanel } from "./StockPanel";

// Bento root for the parts-order console: hero context card, month picker
// (the API buckets by month), the paged order queue, and a quick stock
// panel so packers can correct counts in place. The active tab comes from
// the route; the cursor stack resets the moment the month changes.
export function DispatchOrdersBoard({ status }: { status: DispatchOrderTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const toast = useToast();
  const [month, setMonth] = useState(monthKeyNow());
  const [appliedMonth, setAppliedMonth] = useState(month);
  const [stack, setStack] = useState<CursorStack>(FIRST_PAGE_STACK);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posOpen, setPosOpen] = useState(false);

  // Reset-on-prop-change pattern: switching month restarts the cursor walk
  // synchronously, before the next paint, never in an effect.
  if (month !== appliedMonth) {
    setAppliedMonth(month);
    setStack(FIRST_PAGE_STACK);
  }

  const query = useDispatchOrders({
    status,
    month: appliedMonth,
    cursor: currentCursor(stack),
    limit: DISPATCH_PAGE_SIZE,
  });
  useDispatchOrdersRealtime(true);
  const items = query.data?.items ?? [];
  const nextCursor = query.data?.nextCursor ?? null;

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <BentoCard
          label="Đơn linh kiện"
          className="sm:col-span-2 lg:col-span-2"
        >
          <h2 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
            Vận hành đơn linh kiện
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Xác nhận, đóng gói và giao đơn linh kiện. Hủy đơn sẽ hoàn số lượng
            về kho.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
            />
            Đang xem: {ORDER_TAB_LABELS[status]} ·{" "}
            {formatMonthKey(appliedMonth)}
          </p>
          <button
            type="button"
            onClick={() => setPosOpen(true)}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <FiShoppingBag aria-hidden="true" className="h-4 w-4" />
            Bán tại quầy
          </button>
        </BentoCard>

        <BentoCard label="Bộ lọc tháng" className="sm:col-span-2 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="orders-month"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Tháng đặt hàng
              </label>
              <input
                id="orders-month"
                type="month"
                value={month}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isMonthKey(next)) setMonth(next);
                }}
                className="mt-2 flex min-h-[44px] w-full items-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:max-w-56 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Đơn được nhóm theo tháng đặt hàng.
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

        <OrdersQueueCard
          status={status}
          appliedMonth={appliedMonth}
          query={query}
          items={items}
          nextCursor={nextCursor}
          stack={stack}
          onStack={setStack}
          onOpen={setSelectedId}
        />

        <BentoCard
          label="Tồn kho nhanh"
          className="sm:col-span-2 lg:col-span-4"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Điều chỉnh tồn kho
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sửa số lượng sau kiểm kê hoặc nhập hàng. Sửa giá/danh mục nằm ở
            trang quản trị.
          </p>
          <StockPanel />
        </BentoCard>
      </div>

      {selectedId && (
        <OrderOpsDialog
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onToast={(variant, title, description) =>
            variant === "success"
              ? toast.success(title, description)
              : toast.error(title, description)
          }
        />
      )}
      {posOpen && (
        <PosSaleDialog
          onClose={() => setPosOpen(false)}
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
