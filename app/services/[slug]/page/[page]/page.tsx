import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listPublicCatalog } from "@/lib/catalog/public-catalog.service";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ slug: string; page: string }> };

const FALLBACK_TITLE = "Dịch vụ | FlashWrench";

// Per-tab title plus the page number so shared deep links announce both
// the category and where in it they land. Catalog failures fall back to
// the generic title like the parent leaf.
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  try {
    const { slug, page } = await params;
    const decoded = decodeURIComponent(slug);
    const result = await listPublicCatalog();
    if (result.ok) {
      const category = result.data.categories.find(
        (item) => item.slug === decoded,
      );
      if (category) {
        return {
          title: `${category.name} — Trang ${page} | FlashWrench`,
          description: `Bảng giá ${category.name} cập nhật trực tiếp. Đặt thợ tận nơi trong 1 phút.`,
        };
      }
    }
  } catch {
    // Fall through to the generic title below.
  }
  return { title: FALLBACK_TITLE };
}

// Metadata-only leaf: the /services layout shell renders the landing and
// reads both segments itself. Page 1 canonicalizes to the tab root.
export default async function ServicesCategoryPage({ params }: PageParams) {
  const { slug, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/services/${encodeURIComponent(slug)}`);
  }
  return null;
}
