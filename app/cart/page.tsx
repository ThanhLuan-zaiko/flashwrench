import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";

export const metadata: Metadata = {
  title: "Giỏ hàng | FlashWrench",
  description: "Xem lại linh kiện đã chọn và đặt hàng.",
};

export default function Page() {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <CartPage />
      </div>
    </main>
  );
}
