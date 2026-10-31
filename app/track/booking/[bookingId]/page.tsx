import type { Metadata } from "next";
import Link from "next/link";
import { TaskBar } from "@/components/layout/TaskBar";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { BookingTracker } from "@/components/track/BookingTracker";
import { TrackPlacedBanner } from "@/components/track/TrackPlacedBanner";
import { bookingTicketCode } from "@/lib/track/booking-track-view";

export const metadata: Metadata = {
  title: "Theo dõi đặt lịch | FlashWrench",
  description: "Theo dõi tiến trình sửa xe theo thời gian thực.",
  robots: { index: false, follow: false },
};

// Public guest tracking: the unguessable booking id in the URL is the
// capability — no login, so guests keep this link after checkout.
export default async function TrackBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <TaskBar
        title="FlashWrench"
        trailing={`Phiếu #${bookingTicketCode(bookingId)}`}
      />
      <div className="mx-auto w-full max-w-xl sm:px-6 sm:py-10 md:py-14 lg:max-w-6xl lg:px-8">
        <div className="mb-4 hidden sm:block">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Theo dõi đặt lịch
          </h1>
          <p className="mt-1 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            Phiếu #{bookingTicketCode(bookingId)}
          </p>
        </div>
        <div className="mx-4 mt-4 mb-4 empty:hidden sm:mx-0 sm:mt-0">
          <TrackPlacedBanner kind="booking" />
        </div>
        <BookingTracker bookingId={bookingId} />
        {/* This link is the whole capability model, so the one moment a
            guest realises they lost it belongs right here. */}
        <p className="mx-4 mt-4 mb-28 border-t border-zinc-200 pt-3 text-xs text-zinc-500 sm:mx-0 sm:mb-0 lg:mt-8 dark:border-zinc-800 dark:text-zinc-400">
          Mất đường dẫn này?{" "}
          <Link
            href="/lookup"
            className="font-medium underline underline-offset-4 transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Tra cứu bằng email
          </Link>{" "}
          để xem lại đơn và hóa đơn.
        </p>
      </div>
      <SpeculationRules scope="track" />
    </main>
  );
}
