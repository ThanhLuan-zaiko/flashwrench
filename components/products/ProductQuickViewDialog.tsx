"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FiArrowRight, FiPackage, FiTag, FiX } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { ApplicableVoucherBadge } from "@/components/vouchers/ApplicableVoucherBadge";
import type { PartItem } from "@/lib/parts/parts.types";
import { AddToCartButton } from "./AddToCartButton";
import { ProductGallery } from "./ProductGallery";
import { ProductQuickViewReviews } from "./ProductQuickViewReviews";
import { discountPercent, stockLabel } from "./products-utils";

type ProductQuickViewDialogProps = {
  part: PartItem;
  onClose: () => void;
};

// Quick-view sheet for one shelf card: gallery, price with the compare-at
// strike, SKU/stock facts, specs, compatible vehicles and the review feed.
// Closes on the backdrop, the X button or Escape; the pinned footer keeps
// add-to-cart plus a hop into the full detail page.
export function ProductQuickViewDialog({
  part,
  onClose,
}: ProductQuickViewDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const detailHref = `/products/${encodeURIComponent(part.slug)}`;
  const discount = discountPercent(part.price, part.comparePrice ?? 0);
  const specs = Object.entries(part.specs);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết sản phẩm ${part.name}`}
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng chi tiết sản phẩm"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/50"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-clip rounded-t-2xl border border-zinc-200 bg-white sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              {part.categoryName} · {part.brand}
            </p>
            <h2 className="mt-0.5 break-words text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {part.name}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              SKU {part.sku}
              {part.soldCount > 0 && ` · Đã bán ${part.soldCount}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-5 py-4 ${SCROLLBAR_CLASSES}`}
        >
          <div className="flex flex-col gap-4">
            <ProductGallery images={part.images} name={part.name} />

            <section
              aria-label="Giá và tồn kho"
              className="flex flex-col gap-2"
            >
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {formatVnd(part.price)}
                </span>
                {discount > 0 && part.comparePrice !== null && (
                  <>
                    <span className="text-sm text-zinc-400 line-through dark:text-zinc-500">
                      {formatVnd(part.comparePrice)}
                    </span>
                    <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                      -{discount}%
                    </span>
                  </>
                )}
              </p>
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
                  <FiPackage aria-hidden="true" className="h-3 w-3" />
                  {stockLabel(part)}
                </span>
                {part.carBrands.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
                    <FiTag aria-hidden="true" className="h-3 w-3" />
                    {part.carBrands.join(", ")}
                  </span>
                )}
              </p>
            </section>

            <section
              aria-label="Mô tả sản phẩm"
              className="flex flex-col gap-1.5"
            >
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mô tả
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                {part.description || "Sản phẩm này chưa có mô tả chi tiết."}
              </p>
            </section>

            {specs.length > 0 && (
              <section
                aria-label="Thông số kỹ thuật"
                className="flex flex-col gap-1.5"
              >
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Thông số kỹ thuật
                </p>
                <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {specs.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-baseline justify-between gap-3 py-1.5"
                    >
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                        {key}
                      </dt>
                      <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {part.carModels.length > 0 && (
              <section
                aria-label="Xe tương thích"
                className="flex flex-col gap-1.5"
              >
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Xe tương thích
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {part.carModels.map((model) => (
                    <li
                      key={model}
                      className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
                    >
                      {model}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ApplicableVoucherBadge kind="order" subtotal={part.price} />
            <ProductQuickViewReviews part={part} />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <AddToCartButton part={part} />
          <Link
            href={detailHref}
            aria-label={`Xem trang chi tiết ${part.name}`}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Xem trang chi tiết
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
