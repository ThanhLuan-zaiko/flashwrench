import type { Metadata } from "next";
import { TaskBar } from "@/components/layout/TaskBar";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { OrderTracker } from "@/components/track/OrderTracker";
import { TrackPlacedBanner } from "@/components/track/TrackPlacedBanner";

export const metadata: Metadata = {
  title: "Theo dõi đơn hàng | FlashWrench",
  description: "Theo dõi tiến trình giao hàng theo thời gian thực.",
  robots: { index: false, follow: false },
};

// Public guest tracking: the unguessable order id in the URL is the
// capability — no login, so guests keep this link after checkout.
export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <TaskBar title="Theo dõi đơn hàng" backHref="/" />
      <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 md:py-14 lg:max-w-4xl">
        <div className="mb-4 empty:hidden">
          <TrackPlacedBanner kind="order" />
        </div>
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 sm:p-6">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Theo dõi đơn hàng
          </h1>
          <p className="mt-1 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            {orderId}
          </p>
          <div className="mt-4">
            <OrderTracker orderId={orderId} />
          </div>
        </div>
      </div>
      <SpeculationRules scope="track" />
    </main>
  );
}
