import type { Metadata } from "next";
import { ORDER_TAB_LABELS } from "@/app/dispatch/components/orders/order-tabs";
import type { OrderStatus } from "@/lib/orders/orders.types";

type StatusParams = { params: Promise<{ status: string }> };

const FALLBACK_TITLE = "Đơn hàng & hóa đơn | Quản trị";
const FALLBACK_DESCRIPTION =
  "Theo dõi đơn linh kiện toàn hệ thống và xem hóa đơn thu tiền.";

export async function generateMetadata({
  params,
}: StatusParams): Promise<Metadata> {
  const { status } = await params;
  const label = ORDER_TAB_LABELS[status as OrderStatus];
  if (!label) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `Đơn hàng — ${label} | Quản trị`,
    description: FALLBACK_DESCRIPTION,
  };
}

// Metadata-only: the interactive board lives in the orders layout shell.
export default function AdminOrdersStatusPage() {
  return null;
}
