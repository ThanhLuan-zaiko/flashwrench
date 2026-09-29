"use client";

import { type UseQueryResult, useQueryClient } from "@tanstack/react-query";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { dispatchOrderKeys } from "@/hooks/dispatch-orders";
import type { OrderSummary } from "@/lib/orders/orders.types";
import { fetchDispatchOrders } from "@/services/dispatch-orders.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { FilterTabs } from "../../../mechanic/components/FilterTabs";
import { DispatchPager } from "../bookings/DispatchPager";
import {
  DISPATCH_PAGE_SIZE,
  formatMonthKey,
} from "../bookings/dispatch-format";
import { DispatchOrderCard } from "./DispatchOrderCard";
import {
  DISPATCH_ORDER_TABS,
  type DispatchOrderTab,
  type DispatchOrderTabDef,
  ORDER_TAB_LABELS,
} from "./order-tabs";

type OrdersQueueCardProps = {
  status: DispatchOrderTab;
  appliedMonth: string;
  query: UseQueryResult<{ items: OrderSummary[]; nextCursor: string | null }>;
  items: OrderSummary[];
  // The cursor chain lives on the URL page index; these come from
  // useCursorRoutePage in the parent board.
  page: number;
  canBack: boolean;
  canNext: boolean;
  backHref: string;
  nextHref: string;
  onNextClick: () => void;
  onOpen: (orderId: string) => void;
  /** Tab defs with role-specific hrefs; defaults to the dispatch URLs. */
  tabs?: DispatchOrderTabDef[];
};

// The paged order queue card: status tabs, the month's order list and the
// cursor pager that walks the status partition. Hovering/focusing a tab
// prefetches its first page so the packing→handover flow switches feel
// instant; TanStack dedupes prefetches that are already cached.
export function OrdersQueueCard({
  status,
  appliedMonth,
  query,
  items,
  page,
  canBack,
  canNext,
  backHref,
  nextHref,
  onNextClick,
  onOpen,
  tabs = DISPATCH_ORDER_TABS,
}: OrdersQueueCardProps) {
  const queryClient = useQueryClient();
  const prefetchTab = (tabId: string) => {
    void queryClient.prefetchQuery({
      queryKey: dispatchOrderKeys.list({
        status: tabId,
        month: appliedMonth,
        cursor: null,
        limit: DISPATCH_PAGE_SIZE,
      }),
      queryFn: () =>
        fetchDispatchOrders({
          status: tabId,
          month: appliedMonth,
          cursor: null,
          limit: DISPATCH_PAGE_SIZE,
        }),
      staleTime: 15 * 1000,
    });
  };

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
          tabs={tabs}
          activeId={status}
          ariaLabel="Lọc đơn theo trạng thái"
          onTabPrefetch={prefetchTab}
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
        page={page}
        count={items.length}
        canBack={canBack}
        canNext={canNext}
        loading={query.isFetching}
        backHref={backHref}
        nextHref={nextHref}
        onNextClick={onNextClick}
      />
    </BentoCard>
  );
}
