"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import type { OrderSummary } from "@/lib/orders/orders.types";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { FilterTabs } from "../../../mechanic/components/FilterTabs";
import { DispatchPager } from "../bookings/DispatchPager";
import {
  type CursorStack,
  canGoBack,
  canGoNext,
  pageNumber,
  popCursor,
  pushCursor,
} from "../bookings/dispatch-cursor";
import { formatMonthKey } from "../bookings/dispatch-format";
import { DispatchOrderCard } from "./DispatchOrderCard";
import {
  DISPATCH_ORDER_TABS,
  type DispatchOrderTab,
  ORDER_TAB_LABELS,
} from "./order-tabs";

type OrdersQueueCardProps = {
  status: DispatchOrderTab;
  appliedMonth: string;
  query: UseQueryResult<{ items: OrderSummary[]; nextCursor: string | null }>;
  items: OrderSummary[];
  nextCursor: string | null;
  stack: CursorStack;
  onStack: (stack: CursorStack) => void;
  onOpen: (orderId: string) => void;
};

// The paged order queue card: status tabs, the month's order list and the
// cursor pager that walks the status partition.
export function OrdersQueueCard({
  status,
  appliedMonth,
  query,
  items,
  nextCursor,
  stack,
  onStack,
  onOpen,
}: OrdersQueueCardProps) {
  return (
    <BentoCard label="Hàng đợi xử lý" className="sm:col-span-2 lg:col-span-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Đơn linh kiện
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {items.length} đơn trên trang này · {formatMonthKey(appliedMonth)}
          </p>
        </div>
        <FilterTabs
          tabs={DISPATCH_ORDER_TABS}
          activeId={status}
          ariaLabel="Lọc đơn theo trạng thái"
        />
      </div>

      {query.isPending && (
        <div
          className="mt-4 flex items-center justify-center py-8"
          aria-live="polite"
          aria-busy="true"
        >
          <FiLoader
            aria-hidden="true"
            className="h-8 w-8 text-zinc-400 motion-safe:animate-spin dark:text-zinc-500"
          />
          <span className="sr-only">Đang tải danh sách đơn</span>
        </div>
      )}
      {query.isError && (
        <div className="mt-4 flex flex-col items-center py-8 text-center">
          <FiAlertCircle
            aria-hidden="true"
            className="h-10 w-10 text-zinc-400"
          />
          <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Không tải được danh sách đơn
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-4 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Tải lại
          </button>
        </div>
      )}
      {query.isSuccess && items.length === 0 && (
        <div className="mt-4 flex flex-col items-center py-8 text-center">
          <FiAlertCircle
            aria-hidden="true"
            className="h-10 w-10 text-zinc-400"
          />
          <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Chưa có đơn nào
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Không có đơn ở trạng thái “{ORDER_TAB_LABELS[status]}” trong tháng
            này.
          </p>
        </div>
      )}
      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((order) => (
            <DispatchOrderCard
              key={order.id}
              order={order}
              onOpen={() => onOpen(order.id)}
            />
          ))}
        </ul>
      )}
      <DispatchPager
        page={pageNumber(stack)}
        count={items.length}
        canBack={canGoBack(stack)}
        canNext={canGoNext(nextCursor)}
        loading={query.isFetching}
        onBack={() => onStack(popCursor(stack))}
        onNext={() => {
          if (nextCursor) onStack(pushCursor(stack, nextCursor));
        }}
      />
    </BentoCard>
  );
}
