import type { Metadata } from "next";
import { HistoryEntry } from "@/components/history/HistoryEntry";
import { getServerAccountSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Lịch sử đơn sửa xe | FlashWrench",
  description:
    "Theo dõi đơn sửa xe đang xử lý, vị trí thợ và lịch sử giao dịch FlashWrench.",
};

// Booking tab of /history. The layout already bounced guests; the cached
// session read gives this page the customer id for realtime topics.
export default async function HistoryPage() {
  const session = await getServerAccountSession();
  return <HistoryEntry customerId={session.user?.id ?? ""} />;
}
