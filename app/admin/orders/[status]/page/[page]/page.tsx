import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ORDER_TAB_LABELS } from "@/app/dispatch/components/orders/order-tabs";
import type { OrderStatus } from "@/lib/orders/orders.types";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ status: string; page: string }> };

const FALLBACK_TITLE = "Đơn hàng & hóa đơn | Quản trị";
const FALLBACK_DESCRIPTION =
  "Theo dõi đơn linh kiện toàn hệ thống và xem hóa đơn thu tiền.";

// Deep links on N>1 still bounce to the tab root at runtime — ScyllaDB
// pageState is sequential, so a mid-chain page cannot be fetched cold.
// The segment exists so in-session back/forward restores walked pages.
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { status, page } = await params;
  const label = ORDER_TAB_LABELS[status as OrderStatus];
  if (!label) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `Đơn hàng — ${label} — Trang ${page} | Quản trị`,
    description: FALLBACK_DESCRIPTION,
  };
}

// Metadata-only leaf: the /admin/orders layout shell renders the board
// and reads the page segment itself. Page 1 canonicalizes to the tab
// root.
export default async function AdminOrdersStatusPagedPage({
  params,
}: PageParams) {
  const { status, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/admin/orders/${encodeURIComponent(status)}`);
  }
  return null;
}
