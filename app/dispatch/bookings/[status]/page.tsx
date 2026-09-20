import type { Metadata } from "next";
import { DISPATCH_TABS } from "../../components/bookings/dispatch-tabs";

type StatusParams = { params: Promise<{ status: string }> };

const FALLBACK_TITLE = "Bàn điều phối | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Xác nhận lịch hẹn, phân công thợ và theo dõi đơn sửa xe theo trạng thái.";

// Per-tab title from the tab list so shared links show what they point to.
// Unknown statuses fall back to the generic title; the layout shell shows
// a guidance panel for them instead of guessing.
export async function generateMetadata({
  params,
}: StatusParams): Promise<Metadata> {
  const { status } = await params;
  const entry = DISPATCH_TABS.find((item) => item.id === status);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `${entry.label} | Bàn điều phối`,
    description: FALLBACK_DESCRIPTION,
  };
}

// Metadata-only: the interactive board lives in the /dispatch/bookings
// layout shell so tab switches reuse it without remounting.
export default function DispatchBookingStatusPage() {
  return null;
}
