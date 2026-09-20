"use client";

import Link from "next/link";
import { FiShoppingCart } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useCart } from "@/hooks/cart";

// Header cart shortcut with a live item-count badge. Rendered only for
// customers — the cart API is customer-only, and the hook already skips
// fetching for other roles.
export function CartLink() {
  const me = useMe();
  const cart = useCart();
  if (me.data?.role !== "customer") return null;
  const count = cart.data?.cart.itemCount ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition-all duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <FiShoppingCart aria-hidden="true" className="h-5 w-5" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-900"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
