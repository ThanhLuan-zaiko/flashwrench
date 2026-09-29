import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ page: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Lịch sử đơn sửa xe — Trang ${page} | FlashWrench`,
    description:
      "Theo dõi đơn sửa xe đang xử lý, vị trí thợ và lịch sử giao dịch FlashWrench.",
  };
}

// Metadata-only leaf: the (booking) layout renders HistoryEntry, which
// resolves the page index against the fetched chain — deep cold links
// bounce to the list root because the walk cannot be reconstructed.
export default async function HistoryPagedPage({ params }: PageParams) {
  const { page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect("/history");
  }
  return null;
}
