import type { Metadata } from "next";
import { ServicesSection } from "../../components/ServicesSection";

export const metadata: Metadata = {
  title: "Thùng rác | Cấu hình dịch vụ",
  description: "Khôi phục hoặc xóa vĩnh viễn loại hình và bảng giá.",
};

export default function AdminServicesTrashPage() {
  return <ServicesSection tab="trash" />;
}
