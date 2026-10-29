import Link from "next/link";
import { FiPackage, FiStar } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { discountPercent } from "@/components/products/products-utils";
import type { PartItem } from "@/lib/parts/parts.types";

// Real storefront part for the home products strip. Photo, brand, name and
// price; the whole tile links to the product detail page.
export function HomeProductCard({ part }: { part: PartItem }) {
  const discount = discountPercent(part.price, part.comparePrice ?? 0);

  return (
    <Link
      href={`/products/${encodeURIComponent(part.slug)}`}
      data-reveal
      aria-label={`Xem sản phẩm ${part.name}`}
      className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition-colors duration-200 hover:border-[#1E3A5F]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 md:p-4 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
    >
      <span className="relative block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {part.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
          <img
            src={part.imageUrl}
            alt=""
            loading="lazy"
            className="h-32 w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03] sm:h-40"
          />
        ) : (
          <span className="flex h-32 w-full items-center justify-center text-zinc-300 sm:h-40 dark:text-zinc-700">
            <FiPackage aria-hidden="true" className="h-8 w-8" />
          </span>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
            -{discount}%
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {part.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold tracking-tight text-zinc-900 md:text-base dark:text-zinc-50">
          {part.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 pt-3">
          <span className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatVnd(part.price)}
            </span>
            {discount > 0 && part.comparePrice !== null && (
              <span className="text-xs text-zinc-400 line-through dark:text-zinc-500">
                {formatVnd(part.comparePrice)}
              </span>
            )}
          </span>
          {part.ratingCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <FiStar aria-hidden="true" className="h-3.5 w-3.5" />
              {part.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
