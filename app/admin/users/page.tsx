import type { Metadata } from "next";
import { UsersSection } from "../components/UsersSection";

export const metadata: Metadata = {
  title: "Quản lý người dùng | Quản trị FlashWrench",
  description:
    "Duyệt thợ, khóa tài khoản và xử lý khiếu nại trong hệ thống FlashWrench.",
};

export default function AdminUsersPage() {
  return <UsersSection />;
}
