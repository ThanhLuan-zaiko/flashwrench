import type { Metadata } from "next";
import { REVENUE_RANGE_TABS } from "@/components/revenue/revenue-format";

type RangeParams = { params: Promise<{ range: string }> };

const FALLBACK_TITLE = "Doanh thu | Quản trị";
const FALLBACK_DESCRIPTION =
  "Báo cáo doanh thu toàn hệ thống, phân tích theo thợ và giám sát gian lận.";

export async function generateMetadata({
  params,
}: RangeParams): Promise<Metadata> {
  const { range } = await params;
  const entry = REVENUE_RANGE_TABS.find((item) => item.id === range);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `Doanh thu theo ${entry.label.toLowerCase()} | Quản trị`,
    description: FALLBACK_DESCRIPTION,
  };
}

// Metadata-only: the interactive board lives in the revenue layout shell.
export default function AdminRevenueRangePage() {
  return null;
}
