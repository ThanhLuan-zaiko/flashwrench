import type { Metadata } from "next";
import { VOUCHER_TABS } from "../../components/vouchers/voucher-tabs";

type TabParams = { params: Promise<{ tab: string }> };

const FALLBACK_TITLE = "Ưu đãi voucher | FlashWrench";
const FALLBACK_DESCRIPTION = "Quản lý chiến dịch ví voucher gắn tài khoản.";

// Per-tab title from the tab list so shared tab links show what they
// point to. Unknown tabs fall back to the generic title; the layout shell
// shows a guidance panel for them instead of guessing.
export async function generateMetadata({
  params,
}: TabParams): Promise<Metadata> {
  const { tab } = await params;
  const entry = VOUCHER_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return { title: entry.title, description: entry.description };
}

// Metadata-only: the interactive screen lives in the /admin/vouchers
// layout shell so tab switches reuse it without remounting.
export default function AdminVouchersTabPage() {
  return null;
}
