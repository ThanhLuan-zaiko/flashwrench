"use client";

import Link from "next/link";
import { FiMinus, FiPackage, FiPlus, FiTrash2 } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { useRemoveCartItem, useUpdateCartItem } from "@/hooks/cart";
import type { CartItem } from "@/lib/orders/orders.types";

type CartItemRowProps = {
  item: CartItem;
};

const STEP_BUTTON_CLASSES =
  "flex h-8 w-8 items-center justify-center text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800";

// One cart line: thumbnail, name, an inline qty stepper clamped to stock,
// remove, and the line total. Unavailable lines (deleted or hidden parts)
// carry a warning so the customer notices before checkout.
export function CartItemRow({ item }: CartItemRowProps) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const busy = updateItem.isPending || removeItem.isPending;
  const maxQty = Math.max(1, item.stockQty);

  const setQty = (qty: number) => {
    if (qty < 1) return;
    updateItem.mutate({ partId: item.partId, qty });
  };

  return (
    <li
      data-reveal
      className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Link
        href={`/products/${encodeURIComponent(item.partSlug)}`}
        aria-hidden="true"
        tabIndex={-1}
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600"
      >
        {item.partImage ? (
          // biome-ignore lint/performance/noImgElement: cart thumbnails served immutable from the media store.
          <img
            src={item.partImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <FiPackage className="h-5 w-5" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link
          href={`/products/${encodeURIComponent(item.partSlug)}`}
          className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <p className="line-clamp-2 text-[13px] leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
            {item.partName}
          </p>
          {(!item.available || item.stockQty < item.qty) && (
            <p className="mt-0.5 text-[11px] text-red-600 dark:text-red-400">
              {!item.available ? "Không còn bán" : `Chỉ còn ${item.stockQty}`}
            </p>
          )}
        </Link>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
              <button
                type="button"
                disabled={busy || item.qty <= 1}
                onClick={() => setQty(item.qty - 1)}
                aria-label={`Giảm số lượng ${item.partName}`}
                className={STEP_BUTTON_CLASSES}
              >
                <FiMinus aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
              <span
                aria-live="polite"
                className="min-w-7 text-center text-[13px] font-semibold text-zinc-900 dark:text-zinc-50"
              >
                {item.qty}
              </span>
              <button
                type="button"
                disabled={busy || item.qty >= maxQty}
                onClick={() => setQty(item.qty + 1)}
                aria-label={`Tăng số lượng ${item.partName}`}
                className={STEP_BUTTON_CLASSES}
              >
                <FiPlus aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => removeItem.mutate({ partId: item.partId })}
              aria-label={`Xóa ${item.partName} khỏi giỏ`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-50 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[15px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatVnd(item.lineTotal)}
          </p>
        </div>
      </div>
    </li>
  );
}
