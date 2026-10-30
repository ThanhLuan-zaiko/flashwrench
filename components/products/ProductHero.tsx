import type { PartItem } from "@/lib/parts/parts.types";
import { ProductGallery } from "./ProductGallery";
import { ProductHeroCopy } from "./ProductHeroCopy";

type ProductHeroProps = {
  part: PartItem;
  discount: number;
};

// Full-bleed navy band for /products/[slug]. It starts directly under the site
// header (the layout's top padding is pulled behind it), with the copy on the
// left and the gallery on a white card on the right. Padding is kept tight so
// the whole band fits on one laptop-sized screen.
export function ProductHero({ part, discount }: ProductHeroProps) {
  return (
    <section
      data-reveal
      aria-label="Thông tin sản phẩm"
      className="relative left-1/2 w-screen -translate-x-1/2 -mt-10 overflow-hidden rounded-b-[2.5rem] bg-[#1E3A5F] px-4 pt-6 pb-10 text-white sm:px-6 md:-mt-14 md:pb-12 lg:pt-8"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
        <ProductHeroCopy part={part} discount={discount} />
        <div className="rounded-3xl bg-white p-3 sm:p-4 dark:bg-zinc-950">
          <ProductGallery images={part.images} name={part.name} />
        </div>
      </div>
    </section>
  );
}
