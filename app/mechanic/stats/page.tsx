import type { Metadata } from "next";
import { StatsSection } from "../components/stats/StatsSection";

export const metadata: Metadata = {
  title: "Hiệu suất | Thợ xe FlashWrench",
  description: "Số đơn hoàn thành, điểm đánh giá và doanh thu của thợ.",
};

export default function MechanicStatsPage() {
  return <StatsSection />;
}
