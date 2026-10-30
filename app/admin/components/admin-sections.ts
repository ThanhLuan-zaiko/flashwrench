import type { IconType } from "react-icons";
import {
  FiActivity,
  FiBarChart2,
  FiFileText,
  FiGift,
  FiLifeBuoy,
  FiPackage,
  FiPieChart,
  FiSettings,
  FiSliders,
  FiUsers,
} from "react-icons/fi";
import type { StaffNavGroup } from "@/components/staff/staff-shell.types";

export type AdminSectionId =
  | "dashboard"
  | "users"
  | "services"
  | "products"
  | "vouchers"
  | "orders"
  | "rescue"
  | "revenue"
  | "customer-mix"
  | "settings";

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  description: string;
  group: string;
  href: string;
  icon: IconType;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "dashboard",
    group: "overview",
    label: "Dashboard tổng quan",
    description: "Số liệu vận hành hệ thống theo thời gian thực.",
    href: "/admin",
    icon: FiBarChart2,
  },
  {
    id: "users",
    group: "ops",
    label: "Quản lý người dùng",
    description: "Duyệt thợ, khóa tài khoản, xử lý khiếu nại.",
    href: "/admin/users",
    icon: FiUsers,
  },
  {
    id: "services",
    group: "catalog",
    label: "Cấu hình dịch vụ",
    description: "Quản lý bảng giá và loại hình sửa chữa.",
    href: "/admin/services/categories",
    icon: FiSettings,
  },
  {
    id: "products",
    group: "catalog",
    label: "Quản lý sản phẩm",
    description: "Quản lý danh mục và linh kiện đang bán.",
    href: "/admin/products/categories",
    icon: FiPackage,
  },
  {
    id: "vouchers",
    group: "catalog",
    label: "Ưu đãi voucher",
    description: "Chiến dịch ví voucher gắn tài khoản.",
    href: "/admin/vouchers",
    icon: FiGift,
  },
  {
    id: "rescue",
    group: "ops",
    label: "Cứu hộ khẩn cấp",
    description: "Vùng phục vụ và cấu hình tự điều phối.",
    href: "/admin/rescue",
    icon: FiLifeBuoy,
  },
  {
    id: "orders",
    group: "ops",
    label: "Đơn hàng & hóa đơn",
    description: "Theo dõi đơn linh kiện và xem hóa đơn thu tiền.",
    href: "/admin/orders/pending",
    icon: FiFileText,
  },
  {
    id: "revenue",
    group: "overview",
    label: "Doanh thu",
    description: "Báo cáo toàn hệ thống, theo thợ và giám sát gian lận.",
    href: "/admin/revenue/day",
    icon: FiBarChart2,
  },
  {
    id: "customer-mix",
    group: "overview",
    label: "Nguồn khách hàng",
    description: "Tỷ trọng khách thành viên và vãng lai theo đơn và đăng nhập.",
    href: "/admin/customer-mix/day",
    icon: FiPieChart,
  },
  {
    id: "settings",
    group: "system",
    label: "Cài đặt cửa hàng",
    description: "Chính sách đặt lịch và tham số vận hành chung.",
    href: "/admin/settings",
    icon: FiSliders,
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
  if (pathname.startsWith("/admin/vouchers")) return "vouchers";
  if (pathname.startsWith("/admin/rescue")) return "rescue";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/revenue")) return "revenue";
  if (pathname.startsWith("/admin/customer-mix")) return "customer-mix";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "dashboard";
}

export const ADMIN_NAV_GROUPS: StaffNavGroup[] = [
  {
    id: "overview",
    label: "Tổng quan",
    shortLabel: "Tổng quan",
    icon: FiActivity,
  },
  { id: "ops", label: "Vận hành", shortLabel: "Vận hành", icon: FiUsers },
  { id: "catalog", label: "Danh mục", shortLabel: "Danh mục", icon: FiPackage },
  { id: "system", label: "Hệ thống", shortLabel: "Hệ thống", icon: FiSettings },
];
