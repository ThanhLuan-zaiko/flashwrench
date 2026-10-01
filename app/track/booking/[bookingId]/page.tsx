import type { Metadata } from "next";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { BookingTracker } from "@/components/track/BookingTracker";

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
      <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 md:py-14">
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 sm:p-6">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Theo dõi đặt lịch
          </h1>
          <p className="mt-1 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            {bookingId}
          </p>
          <div className="mt-4">
            <BookingTracker bookingId={bookingId} />
          </div>
        </div>
      </div>
      <SpeculationRules scope="track" />
    </main>
  );
}
