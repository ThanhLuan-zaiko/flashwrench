"use client";

import { FiLoader } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import {
  canCollectCounterPayment,
  type OpsToast,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/components/orders/order-format";
import { useCollectOrderPayment } from "@/hooks/dispatch-orders";
import type { OrderDetail } from "@/lib/orders/orders.types";
import { AuthApiError } from "@/services/auth.api";

type OrderCollectSectionProps = {
  order: OrderDetail;
  onToast: OpsToast;
  onError: (message: string) => void;
};

// Counter payment block inside the ops dialog: shows how the order will be
// settled, and for unpaid "Thanh toán tại quầy" orders a collect button
// that marks it paid without changing the delivery status.
export function OrderCollectSection({
  order,
  onToast,
  onError,
}: OrderCollectSectionProps) {
  const collectPayment = useCollectOrderPayment();
  const collectable = canCollectCounterPayment(order);

  const collect = () => {
    onError("");
    collectPayment.mutate(order.id, {
      onSuccess: () => {
        onToast(
          "success",
          "Đã thu tiền tại quầy",
          `Đơn #${order.id.slice(0, 8)} ghi nhận thanh toán.`,
        );
      },
      onError: (err) => {
        onError(
          err instanceof AuthApiError
            ? (err.errors.form ?? "Không thu được tiền đơn này.")
            : err.message || "Không thu được tiền đơn này.",
        );
      },
    });
  };

  return (
    <section aria-label="Thanh toán">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Thanh toán
        </h3>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} ·{" "}
          {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
        </p>
      </div>
      {collectable && (
        <button
          type="button"
          disabled={collectPayment.isPending}
          onClick={collect}
          className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-900 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
        >
          {collectPayment.isPending && (
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          )}
          Thu tiền tại quầy · {formatVnd(order.total)}
        </button>
      )}
    </section>
  );
}
