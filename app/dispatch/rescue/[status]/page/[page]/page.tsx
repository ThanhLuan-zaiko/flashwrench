import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { RESCUE_BOARD_TABS } from "../../../../components/rescue/rescue-tabs";

type PageParams = { params: Promise<{ status: string; page: string }> };

// Deep links on N>1 still bounce to the tab root at runtime — ScyllaDB
// pageState is sequential, so a mid-chain page cannot be fetched cold.
// The segment exists so in-session back/forward restores walked pages.
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { status, page } = await params;
  const tab = RESCUE_BOARD_TABS.find((item) => item.id === status);
  return {
    title: tab
      ? `${tab.label} — Trang ${page} | Cứu hộ FlashWrench`
      : "Cứu hộ | Điều phối FlashWrench",
    description: "Theo dõi yêu cầu cứu hộ do hệ thống tự giao thợ.",
  };
}

// Metadata-only leaf: the /dispatch/rescue layout shell renders the
// board and reads the page segment itself. Page 1 canonicalizes to the
// tab root.
export default async function DispatchRescueStatusPagedPage({
  params,
}: PageParams) {
  const { status, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/dispatch/rescue/${encodeURIComponent(status)}`);
  }
  return null;
}
