"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import { MaskLines } from "@/components/home/MaskLines";
import { useChapterMotion } from "@/hooks/useChapterMotion";

// Closing chapter of the shop: one statement on the page surface, then the cart
// link, the page's single orange action. Customers reach the cart; guests get
// the login route carrying the intended destination.
export function ProductsCartCta({ isCustomer }: { isCustomer: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  return (
    <section
      ref={rootRef}
      aria-label="Giỏ hàng của bạn"
      data-tour="products-cart-cta"
      className="w-full px-4 pt-6 pb-16 sm:px-6 md:pt-10 md:pb-24 lg:px-10"
    >
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <div className="grid grid-cols-1 gap-8 pt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16 md:pt-16">
        <div data-chapter-row>
          <MaskLines
            lines={["Đã chọn được linh kiện ưng ý?"]}
            className="text-2xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50"
          />
          <p className="mt-4 max-w-xl text-base text-zinc-600 md:text-lg dark:text-zinc-400">
            {isCustomer
              ? "Kiểm tra giỏ hàng, áp voucher rồi đặt hàng. Giao tận nơi hoặc nhận tại gara."
              : "Đăng nhập để thêm linh kiện vào giỏ và theo dõi đơn hàng của bạn."}
          </p>
        </div>
        <div data-chapter-row>
          <Link
            href={isCustomer ? "/cart" : "/login?next=%2Fcart"}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-bold text-[#0F1E33] transition-colors duration-200 hover:bg-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950"
          >
            {isCustomer ? "Xem giỏ hàng" : "Đăng nhập để mua hàng"}
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
