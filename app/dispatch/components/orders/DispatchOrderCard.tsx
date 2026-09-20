"use client";

import { FiChevronRight } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import {
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
} from "@/components/orders/order-format";
import { formatDateTime } from "@/lib/datetime/format";
import type { OrderSummary } from "@/lib/orders/orders.types";

type DispatchOrderCardProps = {
  order: OrderSummary;
  onOpen: () => void;
};

// One queue row: short id, placed time, total and a status badge. Opens
// the ops dialog where the real transitions happen.
export function DispatchOrderCard({ order, onOpen }: DispatchOrderCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-1.5 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-900"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Đơn #{order.id.slice(0, 8)}
            </span>
            <span className={orderStatusBadgeClass(order.status)}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            {formatDateTime(order.createdAt)}
            {order.note && ` · ${order.note}`}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatVnd(order.total)}
          </span>
          <FiChevronRight
            aria-hidden="true"
            className="h-4 w-4 text-zinc-400"
          />
        </span>
      </button>
    </li>
  );
}
