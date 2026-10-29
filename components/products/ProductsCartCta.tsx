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
      data-tour="products-cart-cta"
      className="flex flex-col justify-between gap-5 rounded-3xl bg-[#1E3A5F] p-5 text-white sm:col-span-2 md:flex-row md:items-center md:p-7"
    >
      <div className="max-w-xl">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Đã chọn được linh kiện ưng ý?
        </h2>
        <p className="mt-1 text-sm text-zinc-200">
          {isCustomer
            ? "Kiểm tra giỏ hàng và đặt hàng — giao tận nơi hoặc nhận tại gara."
            : "Đăng nhập để thêm linh kiện vào giỏ và theo dõi đơn hàng của bạn."}
        </p>
      </div>
      <Link
        href={isCustomer ? "/cart" : "/login?next=%2Fcart"}
        className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99] md:w-auto"
      >
        <FiShoppingCart aria-hidden="true" className="h-4 w-4" />
        {isCustomer ? "Xem giỏ hàng" : "Đăng nhập để mua hàng"}
      </Link>
    </section>
  );
}
