"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { HomeProductCard } from "@/components/home/products/HomeProductCard";
import { BRAND_PRIMARY_BUTTON } from "@/components/ui/brand";
import { usePublicParts } from "@/hooks/products";
import { pickCartSuggestions } from "./cart-suggestions";

// Shared empty state for /cart and /checkout: the basket illustration, one
// line on what to do, the shop link, then a few in-stock best sellers so the
// page is not a lone message on wide screens.
export function EmptyCartNotice() {
  const parts = usePublicParts();
  const suggestions = useMemo(
    () => pickCartSuggestions(parts.data?.parts ?? []),
    [parts.data],
  );

  return (
    <div data-reveal className="flex flex-col gap-10">
      <div className="py-6 text-center">
        <Image
          src="/images/isometric/basket.svg"
          alt=""
          width={60}
          height={56}
          className="mx-auto mb-4 h-28 w-auto sm:h-32"
        />
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Giỏ hàng đang trống
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Thêm ắc quy, dầu nhớt hay bóng đèn vào giỏ để đặt hàng.
        </p>
        <Link
          href="/products"
          prefetch
          className={`${BRAND_PRIMARY_BUTTON} mx-auto mt-4 w-fit`}
        >
          Xem sản phẩm
        </Link>
      </div>
      {suggestions.length > 0 ? (
        <section aria-label="Phụ tùng bán chạy">
          <h2 className="border-b border-zinc-200 pb-3 text-base font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
            Phụ tùng bán chạy
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {suggestions.map((part) => (
              <HomeProductCard key={part.id} part={part} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
