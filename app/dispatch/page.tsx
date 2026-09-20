import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Khu vực điều phối | FlashWrench",
  description: "Bàn điều phối đơn hàng cho nhân viên điều hướng.",
};

export default function DispatchIndexPage() {
  redirect("/dispatch/bookings/pending");
}
