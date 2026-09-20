"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { FormAlert } from "@/components/auth/FormAlert";
import { useMyOrder, useMyOrdersRealtime } from "@/hooks/orders";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { formatDateTime } from "@/lib/datetime/format";
import { OrderCancelSection, OrderProgressSection } from "./OrderAsideSections";
import { OrderLinesSection } from "./OrderLinesSection";
import {
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./order-format";

// Customer /orders/[orderId]: full detail — items, totals, shipping info
// and the status timeline. `?placed=1` (set by checkout) shows the
// success banner once; the pending state offers a cancel action.
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "1";
  const orderQuery = useMyOrder(orderId);
  useMyOrdersRealtime(true);
  const [formError, setFormError] = useState("");

  const order = orderQuery.data?.order ?? null;

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <Link
        href="/orders"
        data-reveal
        className="flex w-fit min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
        Tất cả đơn hàng
      </Link>

      {justPlaced && (
        <p
          data-reveal
          className="flex items-center gap-2 rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white dark:border-white dark:bg-white dark:text-zinc-900"
        >
          <FiCheckCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
          Đặt hàng thành công! Cửa hàng sẽ xác nhận đơn trong ít phút.
        </p>
      )}

      {orderQuery.isPending && (
        <div
          aria-busy="true"
          className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        />
      )}

      {orderQuery.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">
            Không tải được đơn hàng hoặc đơn không tồn tại.
          </p>
          <button
            type="button"
            onClick={() => void orderQuery.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}

      {order && (
        <>
          <div
            data-reveal
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                Đơn #{order.id.slice(0, 8)}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatVnd(order.total)}
              </h1>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDateTime(order.createdAt)} ·{" "}
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                  order.paymentMethod}{" "}
                ·{" "}
                {PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                  order.paymentStatus}
              </p>
            </div>
            <span className={orderStatusBadgeClass(order.status)}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          {formError && <FormAlert message={formError} />}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <OrderLinesSection order={order} />
            <div className="flex flex-col gap-3 md:gap-4">
              <OrderProgressSection order={order} />
              <OrderCancelSection
                orderId={order.id}
                status={order.status}
                onError={setFormError}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
