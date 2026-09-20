import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderDetailPage } from "@/components/orders/OrderDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng | FlashWrench",
};

type Params = { params: Promise<{ orderId: string }> };

export default async function Page({ params }: Params) {
  const { orderId } = await params;
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
        <Suspense fallback={null}>
          <OrderDetailPage orderId={orderId} />
        </Suspense>
      </div>
    </main>
  );
}
