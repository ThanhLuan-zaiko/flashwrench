import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { PRODUCT_TABS } from "../../../../components/products/product-tabs";

type PageParams = { params: Promise<{ tab: string; page: string }> };

const FALLBACK_TITLE = "Quản lý sản phẩm | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Quản lý danh mục và linh kiện đang bán trên cửa hàng FlashWrench.";

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tab, page } = await params;
  const entry = PRODUCT_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `${entry.title} — Trang ${page}`,
    description: entry.description,
  };
}

// Metadata-only leaf: the /admin/products layout shell renders the section
// and reads the page segment itself. Page 1 canonicalizes to the tab root.
export default async function AdminProductsTabPagedPage({
  params,
}: PageParams) {
  const { tab, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/admin/products/${encodeURIComponent(tab)}`);
  }
  return null;
}
