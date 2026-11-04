import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listPublicCatalog } from "@/lib/catalog/public-catalog.service";
import { resolveServiceTabRedirect } from "@/lib/catalog/service-tab-slug";

type TabParams = { params: Promise<{ slug: string }> };

const FALLBACK_TITLE = "Dịch vụ | FlashWrench";

// Per-tab title from the live category name so shared tab links show what
// they point to. Best-effort: any catalog failure falls back to the generic
// title instead of breaking the page.
export async function generateMetadata({
  params,
}: TabParams): Promise<Metadata> {
  try {
    const { slug } = await params;
    const decoded = decodeURIComponent(slug);
    const result = await listPublicCatalog();
    if (result.ok) {
      const category = result.data.categories.find(
        (item) => item.slug === decoded,
      );
      if (category) {
        return {
          title: `${category.name} | FlashWrench`,
          description: `Bảng giá ${category.name} cập nhật trực tiếp. Đặt thợ tận nơi trong 1 phút.`,
        };
      }
    }
  } catch {
    // Fall through to the generic title below.
  }
  return {
    title: FALLBACK_TITLE,
    description:
      "Lướt bảng giá sửa xe lưu động cập nhật trực tiếp và đặt thợ tận nơi trong 1 phút.",
  };
}

// Metadata-only: the interactive screen lives in the /services layout shell
// so tab switches reuse it without remounting. Uppercase slugs and service
// slugs are rewritten to the category tab they mean.
export default async function ServiceTabPage({ params }: TabParams) {
  const { slug } = await params;
  const target = await resolveServiceTabRedirect(slug);
  if (target) redirect(`/services/${encodeURIComponent(target)}`);
  return null;
}
