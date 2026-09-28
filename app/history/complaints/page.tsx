import type { Metadata } from "next";
import { MyComplaintsPanel } from "@/components/history/MyComplaintsPanel";

export const metadata: Metadata = {
  title: "Khiếu nại của tôi | FlashWrench",
  description: "Theo dõi các khiếu nại đã gửi và trao đổi với đội ngũ hỗ trợ.",
};

// Complaints tab of /history. The layout already bounced guests.
export default function HistoryComplaintsPage() {
  return <MyComplaintsPanel />;
}
