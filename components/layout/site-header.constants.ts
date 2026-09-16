import {
  FiHome,
  FiLifeBuoy,
  FiPackage,
  FiSettings,
  FiShield,
  FiTool,
} from "react-icons/fi";
import type { UserRole } from "@/lib/auth/user.types";
import type { NavItem } from "./site-header.types";

export const SITE_NAME = "FlashWrench";

export const SITE_TAGLINE = "Sửa xe lưu động";

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: FiHome },
  { href: "/products", label: "Sản phẩm", icon: FiPackage },
  { href: "/services", label: "Dịch vụ", icon: FiSettings },
  { href: "/rescue", label: "Cứu hộ", icon: FiLifeBuoy },
];

export const LOGIN_HREF = "/login";
export const LOGIN_LABEL = "Đăng nhập";

export const ADMIN_LINK: NavItem = {
  href: "/admin",
  label: "Trang quản trị",
  icon: FiShield,
};

export const MECHANIC_LINK: NavItem = {
  href: "/mechanic",
  label: "Khu vực thợ xe",
  icon: FiTool,
};

// Internal workspace link per role. Customer and dispatcher stay null
// because they have no dedicated internal page.
export function getRoleInternalLink(
  role: UserRole | null | undefined,
): NavItem | null {
  if (role === "admin") return ADMIN_LINK;
  if (role === "mechanic") return MECHANIC_LINK;
  return null;
}
