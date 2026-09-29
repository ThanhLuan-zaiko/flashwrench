import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { REVENUE_RANGE_TABS } from "@/components/revenue/revenue-format";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ range: string; page: string }> };

const FALLBACK_TITLE = "Doanh thu | Quản trị";
const FALLBACK_DESCRIPTION =
  "Báo cáo doanh thu toàn hệ thống, phân tích theo thợ và giám sát gian lận.";

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { range, page } = await params;
  const entry = REVENUE_RANGE_TABS.find((item) => item.id === range);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `Doanh thu theo ${entry.label.toLowerCase()} — Trang ${page} | Quản trị`,
    description: FALLBACK_DESCRIPTION,
  };
}

// Metadata-only leaf: the revenue layout shell renders the board and reads
// the page segment itself. Page 1 canonicalizes to the range root.
export default async function AdminRevenuePagedPage({ params }: PageParams) {
  const { range, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/admin/revenue/${encodeURIComponent(range)}`);
  }
  return null;
}
