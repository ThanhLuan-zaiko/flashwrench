import type { Metadata } from "next";
import { UsersSection } from "../../components/UsersSection";

export const metadata: Metadata = {
  title: "Duyệt thợ | Quản lý người dùng",
  description: "Xét duyệt hồ sơ đăng ký làm thợ của FlashWrench.",
};

export default function AdminUsersApprovePage() {
  return <UsersSection tab="approve" />;
}
