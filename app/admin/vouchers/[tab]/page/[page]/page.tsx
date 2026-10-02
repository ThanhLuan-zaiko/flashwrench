import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { VOUCHER_TABS } from "../../../../components/vouchers/voucher-tabs";

type PageParams = { params: Promise<{ tab: string; page: string }> };

const FALLBACK_TITLE = "Ưu đãi voucher | FlashWrench";
const FALLBACK_DESCRIPTION = "Quản lý chiến dịch ví voucher gắn tài khoản.";

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tab, page } = await params;
  const entry = VOUCHER_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `${entry.title} — Trang ${page}`,
    description: entry.description,
  };
}

// Metadata-only leaf: the /admin/vouchers layout shell renders the board
// and reads the page segment itself. Page 1 canonicalizes to the tab root.
export default async function AdminVouchersTabPagedPage({
  params,
}: PageParams) {
  const { tab, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/admin/vouchers/${encodeURIComponent(tab)}`);
  }
  return null;
}
