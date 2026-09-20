import type { Metadata } from "next";
import { PRODUCT_TABS } from "../../components/products/product-tabs";

type TabParams = { params: Promise<{ tab: string }> };

const FALLBACK_TITLE = "Quản lý sản phẩm | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Quản lý danh mục và linh kiện đang bán trên cửa hàng FlashWrench.";

// Per-tab title from the tab list so shared tab links show what they
// point to. Unknown tabs fall back to the generic title; the layout shell
// shows a guidance panel for them instead of guessing.
export async function generateMetadata({
  params,
}: TabParams): Promise<Metadata> {
  const { tab } = await params;
  const entry = PRODUCT_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return { title: entry.title, description: entry.description };
}

// Metadata-only: the interactive screen lives in the /admin/products
// layout shell so tab switches reuse it without remounting.
export default function AdminProductsTabPage() {
  return null;
}
