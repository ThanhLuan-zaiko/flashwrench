import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cứu hộ chờ điều phối | FlashWrench",
  description: "Theo dõi yêu cầu cứu hộ do hệ thống tự giao thợ.",
};

export default function DispatchRescuePage() {
  redirect("/dispatch/rescue/open");
}
