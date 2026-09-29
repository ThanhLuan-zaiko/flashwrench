import type { ReactNode } from "react";
import { HistoryEntry } from "@/components/history/HistoryEntry";
import { getServerAccountSession } from "@/lib/auth/server-session";

// Mount-once shell for the /history booking tab: keeps the list alive
// across /history ↔ /history/page/N so paging never replays effects or
// drops the search/selection state. Leaves stay metadata-only.
export default async function HistoryBookingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAccountSession();
  return (
    <>
      <HistoryEntry customerId={session.user?.id ?? ""} />
      {children}
    </>
  );
}
