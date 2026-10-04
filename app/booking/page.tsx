import type { Metadata } from "next";
import { BookingEntry } from "@/components/booking/BookingEntry";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { getServerAccountSession } from "@/lib/auth/server-session";
import {
  type BookingServiceParams,
  parseBookingServiceParams,
} from "@/lib/booking/booking-service-selection";
import { pageOg } from "@/lib/seo/site";

const DESCRIPTION = "Xác nhận thông tin đặt lịch sửa xe lưu động FlashWrench.";

export const metadata: Metadata = {
  title: "Đặt lịch | FlashWrench",
  description: DESCRIPTION,
  openGraph: pageOg("Đặt lịch | FlashWrench", DESCRIPTION),
};

// Public booking entry: guests book without an account — they leave a
// contact trio on the form and follow the job through the public
// tracking link. Signed-in customers keep their verified identity and
// history-linked flow.
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<BookingServiceParams>;
}) {
  const selection = parseBookingServiceParams(await searchParams);

  const session = await getServerAccountSession();
  const user = session.user;
  const contact = user ? user.phone || user.email : null;

  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14 xl:max-w-7xl">
        <BookingEntry
          serviceIds={selection.serviceIds}
          selectionError={selection.error}
          userName={user?.fullName ?? null}
          userContact={contact}
        />
      </div>
      <SpeculationRules scope="booking" />
    </main>
  );
}
