import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isOrderStatus } from "@/lib/orders/orders.types";
import { parsePageParam } from "@/lib/pagination/page-param";
import { ORDER_TAB_LABELS } from "../../../../components/orders/order-tabs";

type PageParams = { params: Promise<{ status: string; page: string }> };

const FALLBACK_TITLE = "Đơn linh kiện | FlashWrench";

// Deep links on N>1 still bounce to the tab root at runtime — ScyllaDB
// pageState is sequential, so a mid-chain page cannot be fetched cold.
// The segment exists so in-session back/forward restores walked pages.
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { status, page } = await params;
  if (isOrderStatus(status)) {
    return {
      title: `${ORDER_TAB_LABELS[status]} — Trang ${page} | Đơn linh kiện`,
    };
  }
  return { title: FALLBACK_TITLE };
}

// Metadata-only leaf: the /dispatch/orders layout shell renders the
// board and reads the page segment itself. Page 1 canonicalizes to the
// tab root.
export default async function DispatchOrdersStatusPagedPage({
  params,
}: PageParams) {
  const { status, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/dispatch/orders/${encodeURIComponent(status)}`);
  }
  return null;
}
