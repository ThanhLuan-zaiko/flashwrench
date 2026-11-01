import type { Metadata } from "next";
import { MyOrdersPage } from "@/components/orders/MyOrdersPage";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";

export const metadata: Metadata = {
  title: "Đơn hàng | FlashWrench",
  description: "Theo dõi trạng thái các đơn linh kiện đã đặt.",
};

export default function Page() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl w-full px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <MyOrdersPage />
      </div>
      <SpeculationRules scope="orders" />
    </main>
  );
}
