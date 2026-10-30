import { FiPackage, FiTag } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { BackLink } from "@/components/ui/BackLink";
import type { PartItem } from "@/lib/parts/parts.types";
import { AddToCartButton } from "./AddToCartButton";
import { stockLabel } from "./products-utils";

type ProductHeroCopyProps = {
  part: PartItem;
  discount: number;
};

// Left column of the product hero: the back link, headline, price with its
// discount and saving, stock chips and the single orange add-to-cart. Kept
// compact so the whole band fits in one laptop-sized screen.
export function ProductHeroCopy({ part, discount }: ProductHeroCopyProps) {
  const saving =
    part.comparePrice !== null && part.comparePrice > part.price
      ? part.comparePrice - part.price
      : 0;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href="/products" label="Quay lại cửa hàng" onDark />
        <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-100 uppercase">
          {part.categoryName} · {part.brand}
        </span>
        {part.soldCount > 0 && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1E3A5F]">
            Đã bán {part.soldCount}
          </span>
        )}
      </div>

      <div>
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance lg:text-5xl">
          {part.name}
        </h1>
        <p className="mt-2 text-xs font-medium text-zinc-300">SKU {part.sku}</p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-4xl font-extrabold tracking-tight">
            {formatVnd(part.price)}
          </span>
          {discount > 0 && part.comparePrice !== null && (
            <>
              <span className="text-sm text-zinc-300 line-through">
                {formatVnd(part.comparePrice)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#1E3A5F]">
                -{discount}%
              </span>
            </>
          )}
        </div>
        {saving > 0 && (
          <p className="text-xs text-zinc-300">
            Tiết kiệm {formatVnd(saving)} so với giá gốc
          </p>
        )}
      </div>

      {part.description && (
        <p className="max-w-xl text-base leading-relaxed whitespace-pre-line text-zinc-200">
          {part.description}
        </p>
      )}

      <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-100">
        <span className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1">
          <FiPackage aria-hidden="true" className="h-3.5 w-3.5" />
          {stockLabel(part)}
        </span>
        {part.carBrands.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1">
            <FiTag aria-hidden="true" className="h-3.5 w-3.5" />
            {part.carBrands.join(", ")}
          </span>
        )}
      </p>

      <div className="max-w-md">
        <AddToCartButton part={part} emphasis="primary" />
      </div>
    </div>
  );
}
