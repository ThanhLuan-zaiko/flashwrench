import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Khu vực thợ xe | FlashWrench",
  description: "Lịch làm việc, bản đồ, thu nhập và thống kê cho thợ sửa xe.",
};

export default function MechanicIndexPage() {
  redirect("/mechanic/schedule/all");
}
