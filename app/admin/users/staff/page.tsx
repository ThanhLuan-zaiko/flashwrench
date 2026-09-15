import type { Metadata } from "next";
import { UsersSection } from "../../components/UsersSection";

export const metadata: Metadata = {
  title: "Nhân viên | Quản lý người dùng",
  description: "Tạo, sửa, xóa mềm và xóa vĩnh viễn tài khoản nhân viên.",
};

export default function AdminUsersStaffPage() {
  return <UsersSection tab="staff" />;
}
