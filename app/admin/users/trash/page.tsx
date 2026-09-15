import type { Metadata } from "next";
import { UsersSection } from "../../components/UsersSection";

export const metadata: Metadata = {
  title: "Thùng rác | Quản lý người dùng",
  description: "Khôi phục hoặc xóa vĩnh viễn tài khoản nhân viên.",
};

export default function AdminUsersTrashPage() {
  return <UsersSection tab="trash" />;
}
