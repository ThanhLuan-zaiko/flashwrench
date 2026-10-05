import type { Metadata } from "next";
import { SettingsAdminEntry } from "../components/settings/SettingsAdminEntry";

export const metadata: Metadata = {
  title: "Cài đặt cửa hàng | Quản trị FlashWrench",
  description: "Chính sách đặt lịch và tham số vận hành chung của cửa hàng.",
};

export default function AdminSettingsPage() {
  return <SettingsAdminEntry />;
}
