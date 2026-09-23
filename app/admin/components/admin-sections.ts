import type { IconType } from "react-icons";
import { FiBarChart2, FiPackage, FiSettings, FiUsers } from "react-icons/fi";

export type AdminSectionId = "dashboard" | "users" | "services" | "products";

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
    href: "/admin/services/categories",
    icon: FiSettings,
  },
  {
    id: "products",
    label: "Quản lý sản phẩm",
    description: "Quản lý danh mục và linh kiện đang bán.",
    href: "/admin/products/categories",
    icon: FiPackage,
  },
];

export function getAdminSection(id: AdminSectionId): AdminSection {
  return ADMIN_SECTIONS.find((s) => s.id === id) ?? ADMIN_SECTIONS[0];
}

// URL -> sidebar section. Order matters: every non-root /admin path must
// resolve to its own section, unknown paths fall back to the dashboard.
export function sectionIdForPath(pathname: string): AdminSectionId {
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/services")) return "services";
  if (pathname.startsWith("/admin/products")) return "products";
  return "dashboard";
}
