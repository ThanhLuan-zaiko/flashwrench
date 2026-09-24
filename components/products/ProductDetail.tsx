"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FiArrowLeft, FiPackage, FiRefreshCw, FiTag } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { usePartsCatalogRealtime, usePublicPart } from "@/hooks/products";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { AddToCartButton } from "./AddToCartButton";
import { ProductGallery } from "./ProductGallery";
import { discountPercent, stockLabel } from "./products-utils";

// Public /products/[slug] detail: full gallery, specs, compatibility and
// an add-to-cart entry. Subscribes to the parts-catalog topic so price and
// stock stay live while the page is open.
export function ProductDetail({ slug }: { slug: string }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const partQuery = usePublicPart(slug);
  usePartsCatalogRealtime(true);
  const part = partQuery.data?.part ?? null;

  const discount = useMemo(
    () => (part ? discountPercent(part.price, part.comparePrice ?? 0) : 0),
    [part],
  );
  const specs = useMemo(() => Object.entries(part?.specs ?? {}), [part]);

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <Link
        href="/products"
        data-reveal
        className="flex w-fit min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại cửa hàng
      </Link>

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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div data-reveal>
              <ProductGallery images={part.images} name={part.name} />
            </div>

            <div
              data-reveal
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  {part.categoryName} · {part.brand}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance text-zinc-900 md:text-3xl dark:text-zinc-50">
                  {part.name}
                </h1>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  SKU {part.sku}
                  {part.soldCount > 0 && ` · Đã bán ${part.soldCount}`}
                </p>
              </div>

              <p className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
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

              {part.description && (
                <p className="text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                  {part.description}
                </p>
              )}

              <AddToCartButton part={part} returnHref={`/products/${slug}`} />
            </div>
          </div>

          {(specs.length > 0 || part.carModels.length > 0) && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {specs.length > 0 && (
                <section
                  data-reveal
                  aria-label="Thông số kỹ thuật"
                  className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Thông số kỹ thuật
                  </h2>
                  <dl className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {specs.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-baseline justify-between gap-3 py-2"
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
                  data-reveal
                  aria-label="Xe tương thích"
                  className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Xe tương thích
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
