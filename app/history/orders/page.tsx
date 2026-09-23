import type { Metadata } from "next";
import { HistoryOrdersEntry } from "@/components/history/HistoryOrdersEntry";
import { getServerAccountSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Lịch sử đơn mua linh kiện | FlashWrench",
  description:
    "Theo dõi đơn linh kiện đã đặt, vị trí người giao và lộ trình vận chuyển.",
};

// Parts-order tab of /history. The layout already bounced guests; the
// cached session read gives this page the customer id for realtime topics.
export default async function HistoryOrdersPage() {
  const session = await getServerAccountSession();
  return <HistoryOrdersEntry customerId={session.user?.id ?? ""} />;
}
