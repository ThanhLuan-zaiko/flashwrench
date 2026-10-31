import Link from "next/link";
import { FiPackage, FiStar } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { discountPercent } from "@/components/products/products-utils";
import type { PartItem } from "@/lib/parts/parts.types";

// Real storefront part for the home products strip: a large photo that opens
// on scroll, then brand, name and price on the page surface. The whole tile
// links to the product detail page.
export function HomeProductCard({ part }: { part: PartItem }) {
  const discount = discountPercent(part.price, part.comparePrice ?? 0);

  return (
    <li className="min-w-0">
      <Link
        href={`/products/${encodeURIComponent(part.slug)}`}
        data-chapter-row
        aria-label={`Xem sản phẩm ${part.name}`}
        className="group flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
          {part.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
            <img
              src={part.imageUrl}
              alt=""
              loading="lazy"
              data-chapter-photo
              className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
              <FiPackage aria-hidden="true" className="h-8 w-8" />
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
              -{discount}%
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {part.brand}
          </span>
          <span className="mt-1 line-clamp-2 block text-sm font-bold tracking-tight text-zinc-900 md:text-base dark:text-zinc-50">
            {part.name}
          </span>
          <span className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatVnd(part.price)}
              </span>
              {discount > 0 && part.comparePrice !== null && (
                <span className="text-xs text-zinc-500 line-through dark:text-zinc-400">
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
          </span>
        </span>
      </Link>
    </li>
  );
}
