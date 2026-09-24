"use client";

import Link from "next/link";
import { FiArrowLeft, FiRefreshCw, FiShoppingCart } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useMe } from "@/hooks/auth";
import { useCart, useClearCart } from "@/hooks/cart";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import { CartItemRow } from "./CartItemRow";

// Customer /cart page: review lines, adjust quantities and head to
// checkout. The cart only exists for the customer role; guests and staff
// get a guidance panel instead of a doomed request.
export function CartPage() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const me = useMe();
  const cart = useCart();
  const clearCart = useClearCart();

  const cartView = cart.data?.cart ?? null;
  const hasUnavailable =
    cartView?.items.some(
      (item) => !item.available || item.stockQty < item.qty,
    ) ?? false;

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Giỏ hàng"
        title="Linh kiện bạn đã chọn."
        subtitle="Kiểm tra số lượng và tồn kho trước khi đặt hàng."
      />

      {me.isPending && (
        <div
          aria-busy="true"
          className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        />
      )}

      {me.isSuccess && me.data?.role !== "customer" && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {me.data
              ? "Giỏ hàng chỉ dành cho tài khoản khách hàng"
              : "Đăng nhập để xem giỏ hàng"}
          </p>
          <Link
            href={me.data ? "/products" : buildLoginHref("/cart")}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            {me.data ? "Quay lại cửa hàng" : "Đăng nhập"}
          </Link>
        </div>
      )}

      {me.data?.role === "customer" && cart.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được giỏ hàng.</p>
          <button
            type="button"
            onClick={() => void cart.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}

      {me.data?.role === "customer" &&
        cartView &&
        (cartView.items.length === 0 ? (
          <div
            data-reveal
            className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
          >
            <FiShoppingCart
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700"
            />
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Giỏ hàng đang trống
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Chọn linh kiện tại cửa hàng để bắt đầu.
            </p>
            <Link
              href="/products"
              className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
            >
              Xem sản phẩm
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {cartView.items.map((item) => (
                <CartItemRow key={item.partId} item={item} />
              ))}
            </ul>

            {hasUnavailable && (
              <p
                role="alert"
                data-reveal
                className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                Một số sản phẩm đã hết hàng hoặc ngừng bán. Hãy điều chỉnh số
                lượng hoặc xóa khỏi giỏ trước khi đặt hàng.
              </p>
            )}

            <section
              aria-label="Tổng giỏ hàng"
              data-reveal
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Tạm tính ({cartView.itemCount} sản phẩm)
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {formatVnd(cartView.subtotal)}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Phí giao hàng sẽ được xác nhận sau khi đặt.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={clearCart.isPending}
                  onClick={() => clearCart.mutate(undefined)}
                  className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Xóa giỏ hàng
                </button>
                <Link
                  href={hasUnavailable ? "#" : "/checkout"}
                  aria-disabled={hasUnavailable}
                  onClick={(event) => {
                    if (hasUnavailable) event.preventDefault();
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950 ${
                    hasUnavailable ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Đặt hàng
                </Link>
              </div>
            </section>

            <Link
              href="/products"
              className="flex w-fit items-center gap-1.5 text-sm font-semibold text-zinc-600 transition-colors duration-200 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
              Tiếp tục mua sắm
            </Link>
          </>
        ))}
    </div>
  );
}
