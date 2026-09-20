import type { Metadata } from "next";
import { isOrderStatus } from "@/lib/orders/orders.types";
import { ORDER_TAB_LABELS } from "../../components/orders/order-tabs";

type TabParams = { params: Promise<{ status: string }> };

const FALLBACK_TITLE = "Đơn linh kiện | FlashWrench";

export async function generateMetadata({
  params,
}: TabParams): Promise<Metadata> {
  const { status } = await params;
  if (isOrderStatus(status)) {
    return { title: `${ORDER_TAB_LABELS[status]} | Đơn linh kiện` };
  }
  return { title: FALLBACK_TITLE };
}

// Metadata-only: the interactive screen lives in the /dispatch/orders
// layout shell so tab switches reuse it without remounting.
export default function DispatchOrdersStatusPage() {
  return null;
}
