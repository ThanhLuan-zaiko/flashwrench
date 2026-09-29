import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { DISPATCH_TABS } from "../../../../components/bookings/dispatch-tabs";

type PageParams = { params: Promise<{ status: string; page: string }> };

const FALLBACK_TITLE = "Bàn điều phối | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Xác nhận lịch hẹn, phân công thợ và theo dõi đơn sửa xe theo trạng thái.";

// Deep links on N>1 still bounce to the tab root at runtime — ScyllaDB
// pageState is sequential, so a mid-chain page cannot be fetched cold.
// The segment exists so in-session back/forward restores walked pages.
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { status, page } = await params;
  const entry = DISPATCH_TABS.find((item) => item.id === status);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `${entry.label} — Trang ${page} | Bàn điều phối`,
    description: FALLBACK_DESCRIPTION,
  };
}

// Metadata-only leaf: the /dispatch/bookings layout shell renders the
// board and reads the page segment itself. Page 1 canonicalizes to the
// tab root.
export default async function DispatchBookingStatusPagedPage({
  params,
}: PageParams) {
  const { status, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/dispatch/bookings/${encodeURIComponent(status)}`);
  }
  return null;
}
