import Link from "next/link";
import { FiPackage } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { PartItem } from "@/lib/parts/parts.types";
import { AddToCartButton } from "./AddToCartButton";
import { discountPercent, stockLabel } from "./products-utils";

type ProductCardProps = {
  part: PartItem;
};

// One bento cell for a purchasable part: image, brand/SKU, price with a
// compare-at strike and a stock badge. Links into the detail page.
export function ProductCard({ part }: ProductCardProps) {
  const discount = discountPercent(part.price, part.comparePrice ?? 0);
  const href = `/products/${encodeURIComponent(part.slug)}`;

  return (
    <article
      data-reveal
      aria-label={part.name}
      className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <Link
          href={href}
          aria-label={`Xem chi tiết ${part.name}`}
          className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          {part.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
            <img
              src={part.imageUrl}
              alt=""
              loading="lazy"
              className="mb-3 h-28 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
            />
          ) : (
            <div className="mb-3 flex h-28 w-full items-center justify-center rounded-xl border border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700">
              <FiPackage aria-hidden="true" className="h-8 w-8" />
            </div>
          )}
          <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {part.categoryName} · {part.brand}
          </p>
          <h3 className="mt-1 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {part.name}
          </h3>
        </Link>
        {part.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
            {part.description}
          </p>
        )}
        <p className="mt-3 flex flex-wrap items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatVnd(part.price)}
          </span>
          {discount > 0 && part.comparePrice !== null && (
            <>
              <span className="text-xs text-zinc-400 line-through dark:text-zinc-500">
                {formatVnd(part.comparePrice)}
              </span>
              <span className="rounded-full border border-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                -{discount}%
              </span>
            </>
          )}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
            {stockLabel(part)}
          </span>
          <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-800">
            SKU {part.sku}
          </span>
        </p>
      </div>
      <AddToCartButton part={part} returnHref={href} />
    </article>
  );
}
