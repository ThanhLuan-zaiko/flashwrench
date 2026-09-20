"use client";

import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { useRemoveCartItem, useUpdateCartItem } from "@/hooks/cart";
import type { CartItem } from "@/lib/orders/orders.types";

type CartItemRowProps = {
  item: CartItem;
};

const QTY_BUTTON_CLASSES =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

// One cart line: image, name, unit price, qty stepper clamped to stock and
// a remove action. Unavailable lines (deleted or hidden parts) render
// read-only with a warning so the customer notices before checkout.
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
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950"
    >
      <Link
        href={`/products/${encodeURIComponent(item.partSlug)}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        {item.partImage ? (
          // biome-ignore lint/performance/noImgElement: cart thumbnails served immutable from the media store.
          <img
            src={item.partImage}
            alt=""
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.partName}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {formatVnd(item.unitPrice)}
            {!item.available && " · Không còn bán"}
            {item.available &&
              item.stockQty < item.qty &&
              ` · Chỉ còn ${item.stockQty}`}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={busy || item.qty <= 1}
            onClick={() => setQty(item.qty - 1)}
            aria-label={`Giảm số lượng ${item.partName}`}
            className={QTY_BUTTON_CLASSES}
          >
            <FiMinus aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          <span
            aria-live="polite"
            className="min-w-8 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {item.qty}
          </span>
          <button
            type="button"
            disabled={busy || item.qty >= maxQty}
            onClick={() => setQty(item.qty + 1)}
            aria-label={`Tăng số lượng ${item.partName}`}
            className={QTY_BUTTON_CLASSES}
          >
            <FiPlus aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="min-w-20 text-right text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {formatVnd(item.lineTotal)}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => removeItem.mutate({ partId: item.partId })}
          aria-label={`Xóa ${item.partName} khỏi giỏ`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <FiTrash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
