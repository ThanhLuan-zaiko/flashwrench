import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HistoryEntry } from "@/components/history/HistoryEntry";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import { getServerAccountSession } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Lịch sử đơn hàng | FlashWrench",
  description:
    "Theo dõi đơn sửa xe đang xử lý, vị trí thợ và lịch sử giao dịch FlashWrench.",
};

// Customer booking history. Guests bounce to login and return here after
// authenticating, matching the /booking auth loop.
export default async function HistoryPage() {
  const session = await getServerAccountSession();
  if (!session.user) {
    redirect(buildLoginHref("/history"));
  }

  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14 xl:max-w-7xl">
        <HistoryEntry customerId={session.user.id} />
      </div>
    </main>
  );
}
