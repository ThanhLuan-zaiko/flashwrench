import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Đặt hàng | FlashWrench",
  description: "Nhập thông tin giao hàng và xác nhận đơn linh kiện.",
};

export default function Page() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <CheckoutPage />
      </div>
    </main>
  );
}
