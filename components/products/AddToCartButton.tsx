"use client";

import Link from "next/link";
import { FiLoader, FiShoppingCart } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import { useAddToCart } from "@/hooks/cart";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import type { PartItem } from "@/lib/parts/parts.types";

type AddToCartButtonProps = {
  part: PartItem;
  // Where the login redirect should return to after sign-in.
  returnHref?: string;
};

const BUTTON_CLASSES =
  "flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950";

// Auth-aware add-to-cart. Guests go through login with the shop location
// preserved in `?next=`; staff roles see a disabled button since the cart
// is customer-only; customers get a live mutation.
export function AddToCartButton({ part, returnHref }: AddToCartButtonProps) {
  const me = useMe();
  const addToCart = useAddToCart();
  const outOfStock = part.stockQty <= 0;

  if (me.isPending) {
    return (
      <output
        aria-label="Đang kiểm tra đăng nhập"
        className={`${BUTTON_CLASSES} opacity-70`}
      >
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
        Đang kiểm tra…
      </output>
    );
  }

  if (!me.data) {
    return (
      <Link
        href={buildLoginHref(returnHref ?? `/products/${part.slug}`)}
        aria-label={`Đăng nhập để mua ${part.name}`}
        className={BUTTON_CLASSES}
      >
        <FiShoppingCart aria-hidden="true" className="h-4 w-4" />
        Thêm vào giỏ
      </Link>
    );
  }

  if (me.data.role !== "customer") {
    return (
      <button
        type="button"
        disabled
        title="Chỉ tài khoản khách hàng mới mua hàng"
        className={BUTTON_CLASSES}
      >
        <FiShoppingCart aria-hidden="true" className="h-4 w-4" />
        Thêm vào giỏ
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={outOfStock || addToCart.isPending}
      aria-label={`Thêm ${part.name} vào giỏ`}
      onClick={() => addToCart.mutate({ partId: part.id, qty: 1 })}
      className={BUTTON_CLASSES}
    >
      {addToCart.isPending ? (
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
      ) : (
        <FiShoppingCart aria-hidden="true" className="h-4 w-4" />
      )}
      {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
    </button>
  );
}
