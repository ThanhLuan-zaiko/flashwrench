import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProductDetail } from "@/components/products/ProductDetail";
import { canonicalSlug, needsSlugRedirect } from "@/lib/catalog/canonical-slug";
import { getPublicPartBySlug } from "@/lib/parts/public-parts.service";

type DetailParams = { params: Promise<{ slug: string }> };

const FALLBACK_TITLE = "Sản phẩm | FlashWrench";

// Per-product title from the live catalog so shared links show what they
// point to. Best-effort: any failure falls back to the generic title.
export async function generateMetadata({
  params,
}: DetailParams): Promise<Metadata> {
  try {
    const { slug } = await params;
    const result = await getPublicPartBySlug(canonicalSlug(slug));
    if (result.ok) {
      const part = result.data;
      return {
        title: `${part.name} | FlashWrench`,
        description:
          part.description ||
          `Mua ${part.name} chính hãng ${part.brand} tại FlashWrench.`,
      };
    }
  } catch {
    // Fall through to the generic title below.
  }
  return { title: FALLBACK_TITLE };
}

export default async function ProductDetailPage({ params }: DetailParams) {
  const { slug } = await params;
  const canonical = canonicalSlug(slug);
  if (needsSlugRedirect(slug)) {
    redirect(`/products/${encodeURIComponent(canonical)}`);
  }
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <Suspense fallback={null}>
        <ProductDetail slug={canonical} />
      </Suspense>
    </div>
  );
}
