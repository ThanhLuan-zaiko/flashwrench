import type { Metadata } from "next";
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
    const result = await getPublicPartBySlug(decodeURIComponent(slug));
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

// Metadata-only: the detail screen lives in the /products layout shell.
export default function ProductDetailPage() {
  return null;
}
