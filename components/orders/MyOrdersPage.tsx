"use client";

import Link from "next/link";
import { FiArrowRight, FiPackage, FiRefreshCw } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useMe } from "@/hooks/auth";
import { useMyOrders, useMyOrdersRealtime } from "@/hooks/orders";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import { formatDateTime } from "@/lib/datetime/format";
import { ORDER_STATUS_LABELS, orderStatusBadgeClass } from "./order-format";

// Customer /orders page: every parts order with a live status badge.
// Status events arrive on the customer user topic and invalidate the list.
export function MyOrdersPage() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const me = useMe();
  const orders = useMyOrders();
  useMyOrdersRealtime(me.data?.role === "customer");

  const items = orders.data?.orders ?? [];

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Đơn hàng"
        title="Theo dõi đơn linh kiện."
        subtitle="Trạng thái cập nhật trực tiếp khi cửa hàng xử lý đơn."
      />

      {me.isSuccess && me.data?.role !== "customer" && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {me.data
              ? "Đơn hàng chỉ dành cho tài khoản khách hàng"
              : "Đăng nhập để xem đơn hàng"}
          </p>
          <Link
            href={me.data ? "/products" : buildLoginHref("/orders")}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {me.data ? "Quay lại cửa hàng" : "Đăng nhập"}
          </Link>
        </div>
      )}

      {me.data?.role === "customer" && orders.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được đơn hàng.</p>
          <button
            type="button"
            onClick={() => void orders.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}

      {me.data?.role === "customer" && orders.isPending && (
        <div
          aria-busy="true"
          className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        />
      )}

      {me.data?.role === "customer" &&
        orders.isSuccess &&
        items.length === 0 && (
          <div
            data-reveal
            className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
          >
            <FiPackage
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700"
            />
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Bạn chưa có đơn hàng nào
            </p>
            <Link
              href="/products"
              className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((order) => (
            <li key={order.id} data-reveal>
              <Link
                href={`/orders/${order.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors duration-200 hover:border-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
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
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <p className="flex items-center gap-3">
                  <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {formatVnd(order.total)}
                  </span>
                  <FiArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 text-zinc-400"
                  />
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
