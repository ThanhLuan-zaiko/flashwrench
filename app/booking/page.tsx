import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingEntry } from "@/components/booking/BookingEntry";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";
import { getServerAccountSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Đặt lịch | FlashWrench",
  description: "Xác nhận thông tin đặt lịch sửa xe lưu động FlashWrench.",
};

// Separate booking entry for customers. Guests bounce to login with the
// full booking intent (`serviceId`) preserved in `?next=`; logged-in
// customers render directly and never see an auth form again.
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceId?: string }>;
}) {
  const { serviceId } = await searchParams;
  const trimmed = (serviceId ?? "").trim();
  const normalized = trimmed.length > 0 ? trimmed : null;

  const session = await getServerAccountSession();
  if (!session.user) {
    redirect(buildLoginHref(buildBookingHref(normalized)));
  }

  const contact = session.user.phone || session.user.email;

  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14 xl:max-w-7xl">
        <BookingEntry
          serviceId={normalized}
          userName={session.user.fullName}
          userContact={contact}
        />
      </div>
    </main>
  );
}
