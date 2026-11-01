import Link from "next/link";
import { FiPackage } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { ApplicableVoucherBadge } from "@/components/vouchers/ApplicableVoucherBadge";
import type { PartItem } from "@/lib/parts/parts.types";
import { AddToCartButton } from "./AddToCartButton";
import type { ProductTileLayout } from "./products-grid-layout";
import { discountPercent, stockLabel } from "./products-utils";

type ProductCardProps = {
  part: PartItem;
  layout: ProductTileLayout;
  onPreview: () => void;
};

// Tile classes per layout. The row variants widen a tile that fills the last
// cell of a short row, so its photo sits beside the text instead of stretching.
const TILE_CLASSES: Record<
  ProductTileLayout,
  { tile: string; photo: string; body: string }
> = {
  stack: {
    tile: "flex flex-col gap-3",
    photo: "w-full",
    body: "flex flex-1 flex-col gap-2",
  },
  row: {
    tile: "flex flex-row items-start gap-4",
    photo: "w-32 shrink-0 sm:w-44",
    body: "flex min-w-0 flex-1 flex-col gap-2",
  },
  "row-lg": {
    tile: "flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6",
    photo: "w-full lg:w-56 lg:shrink-0",
    body: "flex min-w-0 flex-1 flex-col gap-2",
  },
  "row-phone": {
    tile: "flex flex-row items-start gap-4 lg:flex-col lg:gap-3",
    photo: "w-32 shrink-0 sm:w-44 lg:w-full",
    body: "flex min-w-0 flex-1 flex-col gap-2",
  },
};

const TEXT_ACTION =
  "flex min-h-11 items-center text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100";

// Product tile on the page surface, as on the home parts chapter: the photo sits
// contained on white, then the price above the name. The only solid button is
// add-to-cart (outlined, so a full grid stays light); quick view is a text
// link and the photo and name open the detail page.
export function ProductCard({ part, layout, onPreview }: ProductCardProps) {
  const discount = discountPercent(part.price, part.comparePrice ?? 0);
  const href = `/products/${encodeURIComponent(part.slug)}`;
  const classes = TILE_CLASSES[layout];

  return (
    <article
      data-chapter-row
      aria-label={part.name}
      className={`${classes.tile} h-full min-w-0`}
    >
      <Link
        href={href}
        aria-label={`Xem chi tiết ${part.name}`}
        className={`group block ${classes.photo} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:focus-visible:ring-zinc-100`}
      >
        <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-white dark:bg-zinc-950">
          {part.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: dynamic catalog cover served immutable; next/image optimizer hop needs sharp for zero benefit.
            <img
              src={part.imageUrl}
              alt=""
              loading="lazy"
              data-chapter-photo
              className="h-full w-full object-contain p-4 transition-transform duration-300 motion-safe:group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
              <FiPackage aria-hidden="true" className="h-8 w-8" />
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50">
              -{discount}%
            </span>
          )}
        </span>
      </Link>
      <div className={classes.body}>
        <p className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-base font-bold tracking-tight text-[#1E3A5F] md:text-xl dark:text-zinc-50">
            {formatVnd(part.price)}
          </span>
          {discount > 0 && part.comparePrice !== null && (
            <span className="text-xs text-zinc-500 line-through dark:text-zinc-400">
              {formatVnd(part.comparePrice)}
            </span>
          )}
        </p>
        <h3 className="line-clamp-2 text-sm font-bold tracking-tight text-zinc-900 md:text-base dark:text-zinc-50">
          <Link href={href} className="underline-offset-4 hover:underline">
            {part.name}
          </Link>
        </h3>
        <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {part.categoryName} · {part.brand}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {stockLabel(part)} · SKU {part.sku}
        </p>
        <div className="mt-auto flex flex-col gap-1 pt-2">
          <ApplicableVoucherBadge
            kind="order"
            subtotal={part.price}
            guestHint={false}
          />
          <AddToCartButton part={part} emphasis="outline" />
          <button
            type="button"
            onClick={onPreview}
            aria-label={`Xem nhanh chi tiết ${part.name}`}
            className={TEXT_ACTION}
          >
            Xem nhanh
          </button>
        </div>
      </div>
    </article>
  );
}
