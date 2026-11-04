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
// discount and saving, the stock line and the single orange add-to-cart. Kept
// compact so the whole band fits in one laptop-sized screen.
export function ProductHeroCopy({ part, discount }: ProductHeroCopyProps) {
  const saving =
    part.comparePrice !== null && part.comparePrice > part.price
      ? part.comparePrice - part.price
      : 0;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <BackLink href="/products" label="Quay lại cửa hàng" onDark />
        <p className="text-xs font-semibold tracking-wide text-[#111111]/85 uppercase">
          {part.categoryName} · {part.brand}
        </p>
        {part.soldCount > 0 && (
          <p className="text-xs font-semibold text-[#111111]/85">
            Đã bán {part.soldCount}
          </p>
        )}
      </div>

      <div>
        <h1 className="text-2xl leading-[1.1] font-extrabold tracking-tight text-balance lg:text-3xl">
          {part.name}
        </h1>
        <p className="mt-2 text-xs font-medium text-[#111111]/70">
          SKU {part.sku}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-extrabold tracking-tight">
            {formatVnd(part.price)}
          </span>
          {discount > 0 && part.comparePrice !== null && (
            <>
              <span className="text-sm text-[#111111]/70 line-through">
                {formatVnd(part.comparePrice)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#111111]">
                -{discount}%
              </span>
            </>
          )}
        </div>
        {saving > 0 && (
          <p className="text-xs text-[#111111]/70">
            Tiết kiệm {formatVnd(saving)} so với giá gốc
          </p>
        )}
      </div>

      {part.description && (
        <p className="max-w-xl text-base leading-relaxed whitespace-pre-line text-[#111111]/85">
          {part.description}
        </p>
      )}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-[#111111]">
        <span>{stockLabel(part)}</span>
        {part.carBrands.length > 0 && (
          <span>Dùng cho xe {part.carBrands.join(", ")}</span>
        )}
      </p>

      <div className="max-w-md">
        <AddToCartButton part={part} emphasis="primary" />
      </div>
    </div>
  );
}
