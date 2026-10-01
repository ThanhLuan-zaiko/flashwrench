import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ page: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { page } = await params;
  return { title: `Ví voucher — Trang ${page}` };
}

// Deep links on N>1 still bounce to the list root at runtime — ScyllaDB
// pageState is sequential, so a mid-chain page cannot be fetched cold.
// The segment exists so in-session back/forward restores walked pages.
export default async function VouchersPagedPage({ params }: PageParams) {
  const { page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect("/vouchers");
  }
  return null;
}
