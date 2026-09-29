import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ page: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { page } = await params;
  return { title: `Tồn kho — Trang ${page} | FlashWrench` };
}

// Metadata-only leaf: the stock layout shell renders the board and reads
// the page segment itself. Page 1 canonicalizes to the bare root.
export default async function DispatchStockPagedPage({ params }: PageParams) {
  const { page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) redirect("/dispatch/stock");
  return null;
}
