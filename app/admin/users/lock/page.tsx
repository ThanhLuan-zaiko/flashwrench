import type { Metadata } from "next";
import { UsersSection } from "../../components/UsersSection";

export const metadata: Metadata = {
  title: "Khóa tài khoản | Quản lý người dùng",
  description: "Tìm và xử lý tài khoản vi phạm của FlashWrench.",
};

export default function AdminUsersLockPage() {
  return <UsersSection tab="lock" />;
}
