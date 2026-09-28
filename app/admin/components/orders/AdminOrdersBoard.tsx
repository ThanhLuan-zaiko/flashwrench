"use client";

import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import {
  type CursorStack,
  currentCursor,
  FIRST_PAGE_STACK,
} from "@/app/dispatch/components/bookings/dispatch-cursor";
import {
  DISPATCH_PAGE_SIZE,
  formatMonthKey,
  isMonthKey,
  monthKeyNow,
} from "@/app/dispatch/components/bookings/dispatch-format";
import { OrderInvoiceDialog } from "@/app/dispatch/components/orders/OrderInvoiceDialog";
import { OrdersQueueCard } from "@/app/dispatch/components/orders/OrdersQueueCard";
import type { DispatchOrderTab } from "@/app/dispatch/components/orders/order-tabs";
import { ORDER_TAB_LABELS } from "@/app/dispatch/components/orders/order-tabs";
import {
  useDispatchOrders,
  useDispatchOrdersRealtime,
} from "@/hooks/dispatch-orders";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BentoCard } from "../bento/BentoCard";
import { ADMIN_ORDER_TABS } from "./admin-order-tabs";

// Admin view of the parts-order queue: read-only tracking plus the invoice
// dialog. Staff-only ops (POS, status transitions) stay on the dispatch
// workspace — admins oversee, dispatchers operate.
export function AdminOrdersBoard({ status }: { status: DispatchOrderTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [month, setMonth] = useState(monthKeyNow());
  const [appliedMonth, setAppliedMonth] = useState(month);
  const [appliedStatus, setAppliedStatus] = useState(status);
  const [stack, setStack] = useState<CursorStack>(FIRST_PAGE_STACK);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  // A pageState only belongs to its own status partition, so a month or
  // tab switch restarts the cursor walk synchronously.
  if (month !== appliedMonth || status !== appliedStatus) {
    setAppliedMonth(month);
    setAppliedStatus(status);
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
            Giám sát đơn linh kiện
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Theo dõi toàn bộ đơn và mở hóa đơn thu tiền. Thao tác vận hành do
            nhân viên điều phối thực hiện.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
            />
            Đang xem: {ORDER_TAB_LABELS[status]} ·{" "}
            {formatMonthKey(appliedMonth)}
          </p>
        </BentoCard>

        <BentoCard label="Bộ lọc tháng" className="sm:col-span-2 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="admin-orders-month"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Tháng đặt hàng
              </label>
              <input
                id="admin-orders-month"
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
          onOpen={setInvoiceId}
          tabs={ADMIN_ORDER_TABS}
        />
      </div>

      {invoiceId && (
        <OrderInvoiceDialog
          orderId={invoiceId}
          onClose={() => setInvoiceId(null)}
        />
      )}
    </div>
  );
}
