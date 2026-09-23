"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiLoader,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useMyOrders, useMyOrdersRealtime } from "@/hooks/orders";
import { formatDateTime } from "@/lib/datetime/format";
import {
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
} from "../orders/order-format";
import { HistoryOrderTrackPanel } from "./HistoryOrderTrackPanel";

type HistoryOrdersEntryProps = {
  customerId: string;
};

// /history/orders: every parts order the customer placed, with a live
// delivery-tracking panel on the side mirroring the booking tab.
export function HistoryOrdersEntry({ customerId }: HistoryOrdersEntryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useMyOrders();
  useMyOrdersRealtime(Boolean(customerId));
  const orders = query.data?.orders ?? [];
  const selected = orders.find((order) => order.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Lịch sử"
        title="Đơn mua linh kiện."
        subtitle="Chọn một đơn để xem lộ trình giao hàng; bấm vào dòng để xem chi tiết đơn."
      />

      <div className="grid grid-cols-1 items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <HistoryOrderTrackPanel order={selected} />

        <section
          aria-label="Danh sách đơn mua"
          className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Đơn linh kiện của bạn
            </h2>
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              aria-label="Tải lại danh sách đơn"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <FiRefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${query.isFetching ? "motion-safe:animate-spin" : ""}`}
              />
            </button>
          </div>

          {query.isPending && (
            <p
              aria-busy="true"
              className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
            >
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              Đang tải danh sách đơn…
            </p>
          )}

          {query.isError && (
            <div
              role="alert"
              className="mt-4 flex flex-col items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <p className="flex items-center gap-2">
                <FiAlertCircle
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                />
                Không tải được đơn hàng.
              </p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="min-h-[44px] rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold transition-colors duration-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
              >
                Thử tải lại
              </button>
            </div>
          )}

          {query.isSuccess && orders.length === 0 && (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <FiPackage
                aria-hidden="true"
                className="h-8 w-8 text-zinc-300 dark:text-zinc-700"
              />
              <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Bạn chưa có đơn mua nào
              </p>
              <Link
                href="/products"
                className="mt-4 flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Mua sắm ngay
              </Link>
            </div>
          )}

          {orders.length > 0 && (
            <ul className="mt-3 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(order.id)}
                    aria-pressed={order.id === selectedId}
                    className={`flex min-w-0 flex-1 flex-col gap-1 px-3 py-3 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
                      order.id === selectedId
                        ? "bg-zinc-100 dark:bg-zinc-900"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Đơn #{order.id.slice(0, 8)}
                      </span>
                      <span className={orderStatusBadgeClass(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        {order.fulfillmentType === "pickup"
                          ? "Nhận tại xưởng"
                          : "Giao tận nơi"}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(order.createdAt)} ·{" "}
                      {formatVnd(order.total)}
                    </span>
                  </button>
                  <Link
                    href={`/orders/${order.id}`}
                    aria-label={`Xem chi tiết đơn ${order.id.slice(0, 8)}`}
                    className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
