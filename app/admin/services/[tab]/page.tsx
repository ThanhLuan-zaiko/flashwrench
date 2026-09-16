import type { Metadata } from "next";
import { CATALOG_TABS } from "../../components/services/catalog-tabs";

type TabParams = { params: Promise<{ tab: string }> };

const FALLBACK_TITLE = "Cấu hình dịch vụ | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Quản lý loại hình sửa chữa và bảng giá áp dụng cho khách hàng trên toàn hệ thống.";

// Per-tab title from the tab list so shared tab links show what they point
// to. Unknown tabs fall back to the generic title; the layout shell shows
// a guidance panel for them instead of guessing.
export async function generateMetadata({
  params,
}: TabParams): Promise<Metadata> {
  const { tab } = await params;
  const entry = CATALOG_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return { title: entry.title, description: entry.description };
}

// Metadata-only: the interactive screen lives in the /admin/services layout
// shell so tab switches reuse it without remounting.
export default function AdminServicesTabPage() {
  return null;
}
