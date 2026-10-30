"use client";

import Link from "next/link";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { orderShippingFee } from "@/lib/orders/order-pricing";
import type { CartView, FulfillmentType } from "@/lib/orders/orders.types";
import type { OrderPaymentMethod } from "@/lib/payments/order-payment.types";

type CheckoutSummaryProps = {
  cart: CartView;
  fulfillment: FulfillmentType;
  paymentMethod: OrderPaymentMethod;
  discount: number;
  submitting: boolean;
};

// One-line expectation under the total, matched to the chosen method.
function paymentHint(
  fulfillment: FulfillmentType,
  method: OrderPaymentMethod,
): string {
  if (method === "bank_transfer") {
    return "Bạn sẽ thanh toán online (giả lập) ngay sau khi đặt hàng.";
  }
  if (method === "counter") {
    return "Thanh toán tại quầy khi đến xưởng.";
  }
  return fulfillment === "pickup"
    ? "Thanh toán khi nhận hàng tại xưởng."
    : "Thanh toán khi nhận hàng. Bạn có thể theo dõi đơn vận chuyển trong mục Lịch sử.";
}

const ROW = "flex items-baseline justify-between gap-3 text-[13px]";
const ROW_LABEL = "text-zinc-500 dark:text-zinc-400";
const ROW_VALUE = "font-semibold text-zinc-900 dark:text-zinc-100";

// Order totals plus the submit button. The fee mirrors the server-side
// orderShippingFee rule (pickup ships free). On phones the button docks
// to the bottom edge so the total and the orange action stay in reach.
export function CheckoutSummary({
  cart,
  fulfillment,
  paymentMethod,
  discount,
  submitting,
}: CheckoutSummaryProps) {
  const fee = orderShippingFee(fulfillment, cart.subtotal);
  const payable = Math.max(0, cart.subtotal + fee - discount);
  return (
    <aside
      data-reveal
      aria-label="Tóm tắt đơn hàng"
      className="flex h-fit flex-col gap-2.5 border-t border-zinc-200 pt-4 md:sticky md:top-24 md:col-span-2 md:rounded-3xl md:border md:bg-zinc-50 md:p-5 dark:border-zinc-800 md:dark:bg-zinc-900"
    >
      <div className={ROW}>
        <span className={ROW_LABEL}>Tạm tính</span>
        <span className={ROW_VALUE}>{formatVnd(cart.subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className={ROW}>
          <span className={ROW_LABEL}>Voucher</span>
          <span className={ROW_VALUE}>−{formatVnd(discount)}</span>
        </div>
      )}
      <div className={ROW}>
        <span className={ROW_LABEL}>Phí giao hàng</span>
        <span className={ROW_VALUE}>
          {fulfillment === "pickup"
            ? "Nhận tại xưởng"
            : fee === 0
              ? "Miễn phí"
              : formatVnd(fee)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <span className="text-sm font-bold whitespace-nowrap text-zinc-900 dark:text-zinc-50">
          Tổng thanh toán
        </span>
        <span className="text-2xl font-extrabold tracking-tight whitespace-nowrap text-[#1E3A5F] dark:text-zinc-50">
          {formatVnd(payable)}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {paymentHint(fulfillment, paymentMethod)}
      </p>
      <div
        data-dock-bar="phone"
        className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:border-t max-md:border-zinc-200 max-md:bg-white max-md:px-4 max-md:pt-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:max-md:border-zinc-800 dark:max-md:bg-zinc-950"
      >
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 items-center justify-center self-start gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-[15px] font-bold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950"
        >
          {submitting && (
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
          )}
          Đặt hàng · {formatVnd(payable)}
        </button>
      </div>
      <Link
        href="/cart"
        className="hidden items-center justify-center gap-1.5 text-xs font-semibold text-zinc-600 transition-colors duration-200 hover:text-zinc-900 md:flex dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <FiArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Quay lại giỏ hàng
      </Link>
    </aside>
  );
}
