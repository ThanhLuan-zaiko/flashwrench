"use client";

import { useMemo } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { BackLink } from "@/components/ui/BackLink";
import { usePartsCatalogRealtime, usePublicPart } from "@/hooks/products";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { ApplicableVoucherPanel } from "../vouchers/ApplicableVoucherPanel";
import { ProductHero } from "./ProductHero";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { ProductSpecsBento } from "./ProductSpecsBento";
import { ProductTrustStrip } from "./ProductTrustStrip";
import { discountPercent } from "./products-utils";

// Public /products/[slug] detail: navy hero with the buy box, trust cards,
// specs and compatibility bento, then reviews. Subscribes to the parts-catalog
// topic so price and stock stay live while the page is open.
export function ProductDetail({ slug }: { slug: string }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const partQuery = usePublicPart(slug);
  usePartsCatalogRealtime(true);
  const part = partQuery.data?.part ?? null;

  const discount = useMemo(
    () => (part ? discountPercent(part.price, part.comparePrice ?? 0) : 0),
    [part],
  );

  return (
    <div ref={rootRef} className="flex flex-col gap-4 md:gap-6">
      {!part && <BackLink href="/products" label="Quay lại cửa hàng" />}

      {partQuery.isPending && (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
        >
          <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      )}

      {partQuery.isError && (
        <div
          role="alert"
          data-reveal
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được sản phẩm.</p>
          <p className="mt-1 text-xs">
            Sản phẩm có thể đã ngừng bán hoặc mạng đang gặp sự cố.
          </p>
          <button
            type="button"
            onClick={() => void partQuery.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}

      {part && (
        <>
          <ProductHero part={part} discount={discount} />
          <ApplicableVoucherPanel kind="order" subtotal={part.price} />
          <ProductTrustStrip brand={part.brand} />
          <ProductSpecsBento specs={part.specs} carModels={part.carModels} />
          <ProductReviewsSection
            slug={slug}
            partId={part.id}
            partName={part.name}
          />
        </>
      )}
    </div>
  );
}
