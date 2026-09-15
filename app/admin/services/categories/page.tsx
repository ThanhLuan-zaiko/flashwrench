import type { Metadata } from "next";
import { ServicesSection } from "../../components/ServicesSection";

export const metadata: Metadata = {
  title: "Loại hình | Cấu hình dịch vụ",
  description: "Quản lý loại hình sửa chữa của FlashWrench.",
};

export default function AdminServicesCategoriesPage() {
  return <ServicesSection tab="categories" />;
}
