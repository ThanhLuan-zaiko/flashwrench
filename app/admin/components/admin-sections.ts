import type { IconType } from "react-icons";
import { FiBarChart2, FiSettings, FiUsers } from "react-icons/fi";

export type AdminSectionId = "dashboard" | "users" | "services";

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  description: string;
  href: string;
  icon: IconType;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "dashboard",
    label: "Dashboard tổng quan",
    description: "Số liệu vận hành hệ thống theo thời gian thực.",
    href: "/admin",
    icon: FiBarChart2,
  },
  {
    id: "users",
    label: "Quản lý người dùng",
    description: "Duyệt thợ, khóa tài khoản, xử lý khiếu nại.",
    href: "/admin/users",
    icon: FiUsers,
  },
  {
    id: "services",
    label: "Cấu hình dịch vụ",
    description: "Quản lý bảng giá và loại hình sửa chữa.",
    href: "/admin/services",
    icon: FiSettings,
  },
];

export function getAdminSection(id: AdminSectionId): AdminSection {
  return ADMIN_SECTIONS.find((s) => s.id === id) ?? ADMIN_SECTIONS[0];
}
