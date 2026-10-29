"use client";

import { FiLoader, FiShoppingCart } from "react-icons/fi";
import {
  BRAND_PRIMARY_BUTTON,
  BRAND_SOLID_BUTTON,
} from "@/components/ui/brand";
import { useMe } from "@/hooks/auth";
import { useAddToCart } from "@/hooks/cart";
import type { PartItem } from "@/lib/parts/parts.types";

type AddToCartButtonProps = {
  part: PartItem;
  // "primary": the orange main action on a product detail or quick view.
  // "solid": navy, for the many cards of a catalog grid.
  emphasis?: "primary" | "solid";
};

// Add-to-cart for customers AND guests: the guest cart lives under the
// fw_gid token minted on this first mutation, so no login detour. Staff
// roles see a disabled button since the cart is a shopping surface.
export function AddToCartButton({
  part,
  emphasis = "solid",
}: AddToCartButtonProps) {
  const BUTTON_CLASSES =
    emphasis === "primary" ? BRAND_PRIMARY_BUTTON : BRAND_SOLID_BUTTON;
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

  if (me.data && me.data.role !== "customer") {
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
