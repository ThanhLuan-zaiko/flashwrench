import type { Metadata } from "next";
import { UsersSection } from "../../components/UsersSection";

export const metadata: Metadata = {
  title: "Khiếu nại | Quản lý người dùng",
  description: "Tiếp nhận và xử lý khiếu nại của khách hàng FlashWrench.",
};

export default function AdminUsersComplaintsPage() {
  return <UsersSection tab="complaints" />;
}
