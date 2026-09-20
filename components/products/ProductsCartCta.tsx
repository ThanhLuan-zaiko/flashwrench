"use client";

import Link from "next/link";
import { FiShoppingCart } from "react-icons/fi";

// Bottom-of-page nudge toward the cart. Customers see the cart link;
// guests get the login route carrying the intended destination.
export function ProductsCartCta({ isCustomer }: { isCustomer: boolean }) {
  return (
    <section
      aria-label="Giỏ hàng của bạn"
      data-reveal
      className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Đã chọn được linh kiện ưng ý?
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {isCustomer
            ? "Kiểm tra giỏ hàng và đặt hàng — giao tận nơi hoặc nhận tại gara."
            : "Đăng nhập để thêm linh kiện vào giỏ và theo dõi đơn hàng của bạn."}
        </p>
      </div>
      <Link
        href={isCustomer ? "/cart" : "/login?next=%2Fcart"}
        className="flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        <FiShoppingCart aria-hidden="true" className="h-4 w-4" />
        {isCustomer ? "Xem giỏ hàng" : "Đăng nhập để mua hàng"}
      </Link>
    </section>
  );
}
