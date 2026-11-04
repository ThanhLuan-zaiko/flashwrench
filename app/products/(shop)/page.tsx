import type { Metadata } from "next";
import { pageOg } from "@/lib/seo/site";

const DESCRIPTION =
  "Mua linh kiện ô tô, xe máy chính hãng với giá công khai và tồn kho cập nhật trực tiếp.";

export const metadata: Metadata = {
  title: "Sản phẩm | FlashWrench",
  description: DESCRIPTION,
  openGraph: pageOg("Sản phẩm | FlashWrench", DESCRIPTION),
};

// Metadata-only: the interactive screen lives in the /products layout
// shell so tab switches reuse it without remounting.
export default function ProductsPage() {
  return null;
}
