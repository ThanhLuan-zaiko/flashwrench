import type { Metadata } from "next";
import { MyOrdersPage } from "@/components/orders/MyOrdersPage";

export const metadata: Metadata = {
  title: "Đơn hàng | FlashWrench",
  description: "Theo dõi trạng thái các đơn linh kiện đã đặt.",
};

export default function Page() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <MyOrdersPage />
      </div>
    </main>
  );
}
