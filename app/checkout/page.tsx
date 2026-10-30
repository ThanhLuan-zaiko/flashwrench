import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { TaskBar } from "@/components/layout/TaskBar";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";

export const metadata: Metadata = {
  title: "Đặt hàng | FlashWrench",
  description: "Nhập thông tin giao hàng và xác nhận đơn linh kiện.",
};

export default function Page() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <TaskBar title="Thanh toán" backHref="/cart" />
      <div className="mx-auto w-full max-w-4xl px-4 pt-5 pb-10 sm:px-6 sm:pt-10 md:py-14">
        <CheckoutPage />
      </div>
      <SpeculationRules scope="checkout" />
    </main>
  );
}
