import type { Metadata } from "next";
import { ServicesSection } from "../../components/ServicesSection";

export const metadata: Metadata = {
  title: "Bảng giá | Cấu hình dịch vụ",
  description: "Quản lý bảng giá sửa chữa của FlashWrench.",
};

export default function AdminServicesPricesPage() {
  return <ServicesSection tab="prices" />;
}
