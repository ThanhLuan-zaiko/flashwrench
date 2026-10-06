"use client";

import { useState } from "react";
import { FiCheckCircle, FiCreditCard, FiHome } from "react-icons/fi";
import { PaymentCodeCard } from "@/components/revenue/PaymentCodeCard";
import type { OrderDetail } from "@/lib/orders/orders.types";
import { MockPaymentDialog } from "./MockPaymentDialog";
import {
  canMockPayOnline,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./order-format";

type OrderPaymentSectionProps = {
  order: OrderDetail;
  onError: (message: string) => void;
};

// Customer-facing payment block on the order detail page: shows method +
// status, and for unpaid bank_transfer orders a "Thanh toán ngay" button
// that opens the simulated gateway dialog. Counter orders just explain
// where to pay; staff settle those at the till.
export function OrderPaymentSection({
  order,
  onError,
}: OrderPaymentSectionProps) {
  const [paying, setPaying] = useState(false);
  const [paidRef, setPaidRef] = useState<string | null>(null);
  const mockPayable = canMockPayOnline(order);

  const methodLabel =
    PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod;
  const statusLabel =
    PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus;

  return (
    <section
      data-reveal
      aria-label="Thanh toán"
      className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Thanh toán
      </h2>
      <p className="mt-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        {methodLabel} · {statusLabel}
      </p>

      {order.paymentStatus === "paid" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <FiCheckCircle aria-hidden="true" className="h-3.5 w-3.5" />
          {paidRef
            ? `Đã thanh toán · Mã GD ${paidRef}`
            : "Đơn hàng đã được thanh toán."}
        </p>
      )}

      {order.paymentStatus === "refunded" && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Khoản thanh toán (giả lập) đã được hoàn lại.
        </p>
      )}

      {order.paymentStatus === "unpaid" &&
        order.paymentMethod === "counter" &&
        order.status !== "cancelled" && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <FiHome
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
            />
            {order.fulfillmentType === "pickup"
              ? "Thanh toán tại quầy khi đến xưởng nhận hàng."
              : "Vui lòng đến quầy tại xưởng để thanh toán trước khi đơn được giao."}
          </p>
        )}

      {order.paymentStatus === "unpaid" &&
        order.paymentMethod === "cod" &&
        order.status !== "cancelled" && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Bạn sẽ thanh toán khi nhận hàng.
          </p>
        )}

      {/* Courier COD: once the mechanic issues a code the customer reads it
      back at the door — the only way cash collection gets recorded. */}
      {order.paymentConfirmCode && (
        <div className="mt-3">
          <PaymentCodeCard code={order.paymentConfirmCode} />
        </div>
      )}

      {mockPayable && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <FiCreditCard
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
            />
            Đơn đang chờ thanh toán online (giả lập).
          </p>
          <button
            type="button"
            onClick={() => setPaying(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Thanh toán ngay
          </button>
        </div>
      )}

      {paying && (
        <MockPaymentDialog
          orderId={order.id}
          total={order.total}
          onClose={() => setPaying(false)}
          onPaid={(ref) => {
            setPaying(false);
            setPaidRef(ref);
          }}
          onError={onError}
        />
      )}
    </section>
  );
}
