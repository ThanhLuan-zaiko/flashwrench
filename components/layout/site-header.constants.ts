import { FiHome, FiLifeBuoy, FiPackage, FiSettings } from "react-icons/fi";
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
