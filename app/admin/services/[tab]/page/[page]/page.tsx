import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { CATALOG_TABS } from "../../../../components/services/catalog-tabs";

type PageParams = { params: Promise<{ tab: string; page: string }> };

const FALLBACK_TITLE = "Cấu hình dịch vụ | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Quản lý loại hình sửa chữa và bảng giá áp dụng cho khách hàng trên toàn hệ thống.";

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tab, page } = await params;
  const entry = CATALOG_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `${entry.title} — Trang ${page}`,
    description: entry.description,
  };
}

// Metadata-only leaf: the /admin/services layout shell renders the section
// and reads the page segment itself. Page 1 canonicalizes to the tab root.
export default async function AdminServicesTabPagedPage({
  params,
}: PageParams) {
  const { tab, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/admin/services/${encodeURIComponent(tab)}`);
  }
  return null;
}
