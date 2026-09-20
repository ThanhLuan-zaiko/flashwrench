"use client";

import Link from "next/link";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { CartView } from "@/lib/orders/orders.types";

type CheckoutSummaryProps = {
  cart: CartView;
  submitting: boolean;
};

// Order summary aside rendered inside the checkout form — the submit
// button lives here so the form's grid columns stay balanced.
export function CheckoutSummary({ cart, submitting }: CheckoutSummaryProps) {
  return (
    <aside
      data-reveal
      aria-label="Tóm tắt đơn hàng"
      className="flex h-fit flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-950"
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
      <div className="flex items-baseline justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Tổng thanh toán
        </span>
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {formatVnd(cart.subtotal)}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Thanh toán khi nhận hàng. Phí giao hàng (nếu có) sẽ được báo trước khi
        đóng gói.
      </p>
      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        {submitting && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        Xác nhận đặt hàng
      </button>
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
