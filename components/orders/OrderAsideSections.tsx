"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useCancelOrder } from "@/hooks/orders";
import { formatDateTime } from "@/lib/datetime/format";
import type { OrderDetail, OrderStatus } from "@/lib/orders/orders.types";
import { canCustomerCancel, ORDER_STATUS_LABELS } from "./order-format";

// Shipping snapshot + status timeline for one order detail panel.
export function OrderProgressSection({ order }: { order: OrderDetail }) {
  return (
    <>
      <section
        data-reveal
        aria-label="Thông tin giao hàng"
        className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Giao hàng
        </h2>
        <p className="mt-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          {order.customerName} · {order.customerPhone}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {order.address?.fullText || "—"}
        </p>
        {order.note && (
          <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Ghi chú: {order.note}
          </p>
        )}
      </section>

      <section
        data-reveal
        aria-label="Tiến trình đơn hàng"
        className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Tiến trình
        </h2>
        <ol className="mt-3 space-y-2.5">
          {order.history.map((entry, index) => (
            <li
              key={`${entry.changedAt ?? "init"}-${index}`}
              className="flex items-start gap-2.5"
            >
              <span
                aria-hidden="true"
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  index === order.history.length - 1
                    ? "bg-zinc-900 dark:bg-white"
                    : "border border-zinc-300 dark:border-zinc-700"
                }`}
              />
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {ORDER_STATUS_LABELS[entry.newStatus as OrderStatus] ??
                    entry.newStatus}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {formatDateTime(entry.changedAt)}
                  {entry.note && ` · ${entry.note}`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

// Two-step cancel block: only pending orders qualify. Cancellation
// restocks every line on the server.
export function OrderCancelSection({
  orderId,
  status,
  onError,
}: {
  orderId: string;
  status: OrderStatus;
  onError: (message: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const cancelOrder = useCancelOrder();
  if (!canCustomerCancel(status)) return null;

  const cancel = () =>
    cancelOrder.mutate(orderId, {
      onSuccess: () => setConfirming(false),
      onError: (error) => onError(error.message || "Không hủy được đơn."),
    });

  return (
    <section
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {confirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Hủy đơn hàng này?
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Đơn đang chờ xác nhận — hủy ngay sẽ hoàn trả toàn bộ số lượng về
            kho.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cancelOrder.isPending}
              onClick={cancel}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {cancelOrder.isPending && (
                <FiLoader
                  aria-hidden="true"
                  className="h-4 w-4 motion-safe:animate-spin"
                />
              )}
              Xác nhận hủy
            </button>
            <button
              type="button"
              disabled={cancelOrder.isPending}
              onClick={() => setConfirming(false)}
              className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Giữ đơn
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Hủy đơn hàng
        </button>
      )}
    </section>
  );
}
