import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { INCOME_TABS } from "../../../../components/income/income-tabs";

type PageParams = { params: Promise<{ state: string; page: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { state, page } = await params;
  const tab = INCOME_TABS.find((item) => item.id === state);
  return {
    title: tab
      ? `${tab.label} — Trang ${page} | Thu nhập thợ xe`
      : "Thu nhập | Thợ xe FlashWrench",
    description: "Doanh thu và lịch sử giao dịch của thợ sửa xe.",
  };
}

// Metadata-only leaf: the /mechanic/income layout shell renders the
// section and reads the page segment itself. Page 1 canonicalizes to the
// tab root.
export default async function MechanicIncomeStatePagedPage({
  params,
}: PageParams) {
  const { state, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/mechanic/income/${encodeURIComponent(state)}`);
  }
  return null;
}
