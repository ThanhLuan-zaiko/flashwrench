import type { Metadata } from "next";
import { HistoryRescueEntry } from "@/components/history/HistoryRescueEntry";
import { getServerAccountSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Lịch sử cứu hộ | FlashWrench",
  description:
    "Theo dõi các yêu cầu cứu hộ khẩn cấp đã gửi và thợ được điều phối.",
};

// Rescue tab of /history. The layout already bounced guests; the cached
// session read gives this page the customer id for realtime topics.
export default async function HistoryRescuePage() {
  const session = await getServerAccountSession();
  return <HistoryRescueEntry customerId={session.user?.id ?? ""} />;
}
