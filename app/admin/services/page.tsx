import type { Metadata } from "next";
import { ServicesSection } from "../components/ServicesSection";

export const metadata: Metadata = {
  title: "Cấu hình dịch vụ | Quản trị FlashWrench",
  description: "Quản lý bảng giá và loại hình sửa chữa của FlashWrench.",
};

export default function AdminServicesPage() {
  return <ServicesSection />;
}
