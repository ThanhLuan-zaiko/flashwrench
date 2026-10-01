"use client";

import { useState } from "react";
import { FiAlertCircle, FiLoader, FiX } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import {
  type OpsToast,
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
} from "@/components/orders/order-format";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useMe } from "@/hooks/auth";
import { useDispatchOrder } from "@/hooks/dispatch-orders";
import { OrderCollectSection } from "./OrderCollectSection";
import { OrderOpsDetail } from "./OrderOpsDetail";
import { OrderOpsTransitions } from "./OrderOpsTransitions";

type OrderOpsDialogProps = {
  orderId: string;
  onClose: () => void;
  onToast: OpsToast;
  onViewInvoice?: () => void;
};

// Ops dialog for one parts order: items, totals, address, history and the
// legal status transitions for the current state. Refund targets are
// admin-only so dispatchers never see that button.
export function OrderOpsDialog({
  orderId,
  onClose,
  onToast,
  onViewInvoice,
}: OrderOpsDialogProps) {
  const me = useMe();
  const query = useDispatchOrder(orderId);
  const [error, setError] = useState("");
  const order = query.data?.order ?? null;

  const isAdmin = me.data?.role === "admin";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết đơn linh kiện"
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng chi tiết đơn"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div
        className={`relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Đơn linh kiện
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Mã đơn {orderId.slice(0, 8)}…
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {query.isPending && (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
            Đang tải chi tiết…
          </div>
        )}
        {query.isError && (
          <div className="mt-6 flex flex-col items-center py-6 text-center">
            <FiAlertCircle
              aria-hidden="true"
              className="h-8 w-8 text-zinc-400"
            />
            <p className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Không tải được đơn hàng
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-3 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Tải lại
            </button>
          </div>
        )}

        {order && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={orderStatusBadgeClass(order.status)}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatVnd(order.total)}
              </span>
            </div>

            <OrderOpsDetail order={order} onViewInvoice={onViewInvoice} />

            <OrderCollectSection
              order={order}
              onToast={onToast}
              onError={setError}
            />

            <OrderOpsTransitions
              order={order}
              isAdmin={isAdmin}
              onToast={onToast}
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
