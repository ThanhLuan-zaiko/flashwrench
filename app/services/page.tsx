import type { Metadata } from "next";
import { pageOg } from "@/lib/seo/site";

const DESCRIPTION =
  "Lướt bảng giá sửa xe lưu động cập nhật trực tiếp và đặt thợ tận nơi trong 1 phút.";

export const metadata: Metadata = {
  title: "Dịch vụ | FlashWrench",
  description: DESCRIPTION,
  openGraph: pageOg("Dịch vụ | FlashWrench", DESCRIPTION),
};

// Metadata-only: the interactive screen lives in the /services layout shell
// so tab switches reuse it without remounting.
export default function ServicesPage() {
  return null;
}
