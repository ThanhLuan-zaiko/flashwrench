import type { IconType } from "react-icons";
import {
  FiLock,
  FiMessageSquare,
  FiTrash2,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

export type UserTab = "approve" | "lock" | "staff" | "trash" | "complaints";

export type UserTabDef = {
  id: UserTab;
  label: string;
  href: string;
  icon: IconType;
  title: string;
  description: string;
};

function tabHref(id: UserTab): string {
  return `/admin/users/${id}`;
}

export const USER_TABS: UserTabDef[] = [
  {
    id: "approve",
    label: "Duyệt thợ",
    href: tabHref("approve"),
    icon: FiUserCheck,
    title: "Duyệt thợ | Quản lý người dùng",
    description: "Xét duyệt hồ sơ đăng ký làm thợ của FlashWrench.",
  },
  {
    id: "lock",
    label: "Khóa tài khoản",
    href: tabHref("lock"),
    icon: FiLock,
    title: "Khóa tài khoản | Quản lý người dùng",
    description: "Tìm và xử lý tài khoản vi phạm của FlashWrench.",
  },
  {
    id: "staff",
    label: "Nhân viên",
    href: tabHref("staff"),
    icon: FiUsers,
    title: "Nhân viên | Quản lý người dùng",
    description: "Tạo, sửa, xóa mềm và xóa vĩnh viễn tài khoản nhân viên.",
  },
  {
    id: "trash",
    label: "Thùng rác",
    href: tabHref("trash"),
    icon: FiTrash2,
    title: "Thùng rác | Quản lý người dùng",
    description: "Khôi phục hoặc xóa vĩnh viễn tài khoản nhân viên.",
  },
  {
    id: "complaints",
    label: "Khiếu nại",
    href: tabHref("complaints"),
    icon: FiMessageSquare,
    title: "Khiếu nại | Quản lý người dùng",
    description: "Tiếp nhận và xử lý khiếu nại của khách hàng FlashWrench.",
  },
];

export function isUserTab(value: unknown): value is UserTab {
  return (
    value === "approve" ||
    value === "lock" ||
    value === "staff" ||
    value === "trash" ||
    value === "complaints"
  );
}

export function userTabHref(id: UserTab): string {
  return tabHref(id);
}
