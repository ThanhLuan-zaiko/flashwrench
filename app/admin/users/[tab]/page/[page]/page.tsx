import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { USER_TABS } from "../../../../components/users/user-tabs";

type PageParams = { params: Promise<{ tab: string; page: string }> };

const FALLBACK_TITLE = "Quản lý người dùng | FlashWrench";
const FALLBACK_DESCRIPTION =
  "Duyệt thợ, khóa tài khoản, quản lý nhân viên và xử lý khiếu nại tại một nơi duy nhất.";

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { tab, page } = await params;
  const entry = USER_TABS.find((item) => item.id === tab);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `${entry.title} — Trang ${page}`,
    description: entry.description,
  };
}

// Metadata-only leaf: the /admin/users layout shell renders the section
// and reads the page segment itself. Page 1 canonicalizes to the tab root.
export default async function AdminUsersTabPagedPage({ params }: PageParams) {
  const { tab, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/admin/users/${encodeURIComponent(tab)}`);
  }
  return null;
}
