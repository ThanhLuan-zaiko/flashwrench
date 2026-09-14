import type { Metadata } from "next";
import { DashboardSection } from "./components/DashboardSection";

export const metadata: Metadata = {
  title: "Dashboard tổng quan | Quản trị FlashWrench",
  description: "Số liệu vận hành hệ thống FlashWrench theo thời gian thực.",
};

export default function AdminDashboardPage() {
  return <DashboardSection />;
}
