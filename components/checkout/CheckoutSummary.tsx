"use client";

import Link from "next/link";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { orderShippingFee } from "@/lib/orders/order-pricing";
import type {
  CartView,
  FulfillmentType,
  OrderFieldErrors,
} from "@/lib/orders/orders.types";
import type { OrderPaymentMethod } from "@/lib/payments/order-payment.types";
import { CheckoutPaymentFields } from "./CheckoutPaymentFields";

type CheckoutSummaryProps = {
  cart: CartView;
  fulfillment: FulfillmentType;
  paymentMethod: OrderPaymentMethod;
  discount: number;
  errors: OrderFieldErrors;
  submitting: boolean;
  onPaymentMethod: (value: OrderPaymentMethod) => void;
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

// Order summary aside rendered inside the checkout form — the submit
// button lives here so the form's grid columns stay balanced. The fee
// mirrors the server-side orderShippingFee rule (pickup ships free).
export function CheckoutSummary({
  cart,
  fulfillment,
  paymentMethod,
  discount,
  errors,
  submitting,
  onPaymentMethod,
}: CheckoutSummaryProps) {
  const fee = orderShippingFee(fulfillment, cart.subtotal);
  const payable = Math.max(0, cart.subtotal + fee - discount);
  return (
    <aside
      data-reveal
      aria-label="Tóm tắt đơn hàng"
      className="flex h-fit flex-col gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Đơn hàng ({cart.itemCount} sản phẩm)
      </h2>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {cart.items.map((item) => (
          <li
            key={item.partId}
            className="flex items-baseline justify-between gap-3 py-2"
          >
            <span className="min-w-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
              {item.partName} × {item.qty}
            </span>
            <span className="shrink-0 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {formatVnd(item.lineTotal)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
        <span className="text-zinc-600 dark:text-zinc-400">Tạm tính</span>
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
          {formatVnd(cart.subtotal)}
        </span>
      </div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">Phí giao hàng</span>
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
          {fulfillment === "pickup"
            ? "Nhận tại xưởng"
            : fee === 0
              ? "Miễn phí"
              : formatVnd(fee)}
        </span>
      </div>
      {discount > 0 && (
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">
            Voucher tài khoản
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            −{formatVnd(discount)}
          </span>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-dashed border-zinc-400 pt-3 dark:border-zinc-600">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Tổng thanh toán
        </span>
        <span className="text-3xl font-extrabold tracking-tight text-[#1E3A5F] dark:text-zinc-50">
          {formatVnd(payable)}
        </span>
      </div>
      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <CheckoutPaymentFields
          fulfillment={fulfillment}
          paymentMethod={paymentMethod}
          errors={errors}
          disabled={submitting}
          onPaymentMethod={onPaymentMethod}
        />
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {paymentHint(fulfillment, paymentMethod)}
      </p>
      {/* Pinned to the bottom edge on phones so the order total and the
      single orange action stay in reach while scrolling the form. */}
      <div className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:border-t max-md:border-zinc-200 max-md:bg-white max-md:px-4 max-md:pt-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:max-md:border-zinc-800 dark:max-md:bg-zinc-950">
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2.5 text-base font-bold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950"
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
        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-600 transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <FiArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Quay lại giỏ hàng
      </Link>
    </aside>
  );
}
