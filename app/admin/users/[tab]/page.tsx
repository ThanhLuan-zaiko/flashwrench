import type { Metadata } from "next";
import { USER_TABS } from "../../components/users/user-tabs";

type TabParams = { params: Promise<{ tab: string }> };

const FALLBACK_TITLE = "Quản lý người dùng | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Duyệt thợ, khóa tài khoản, quản lý nhân viên và xử lý khiếu nại tại một nơi duy nhất.";

// Per-tab title from the tab list so shared tab links show what they point
// to. Unknown tabs fall back to the generic title; the layout shell shows
// a guidance panel for them instead of guessing.
export async function generateMetadata({
  params,
}: TabParams): Promise<Metadata> {
  const { tab } = await params;
  const entry = USER_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return { title: entry.title, description: entry.description };
}

// Metadata-only: the interactive screen lives in the /admin/users layout
// shell so tab switches reuse it without remounting.
export default function AdminUsersTabPage() {
  return null;
}
