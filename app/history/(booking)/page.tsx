import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lịch sử đơn sửa xe | FlashWrench",
  description:
    "Theo dõi đơn sửa xe đang xử lý, vị trí thợ và lịch sử giao dịch FlashWrench.",
};

// Metadata-only leaf: the (booking) route-group layout renders
// HistoryEntry so page navigation keeps the mounted shell.
export default function HistoryPage() {
  return null;
}
