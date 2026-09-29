import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ page: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Dịch vụ — Trang ${page} | FlashWrench`,
    description:
      "Lướt bảng giá sửa xe lưu động cập nhật trực tiếp và đặt thợ tận nơi trong 1 phút.",
  };
}

// Metadata-only leaf: the /services layout shell renders the landing and
// reads the page segment itself. Page 1 canonicalizes to the bare root.
export default async function ServicesCatalogPage({ params }: PageParams) {
  const { page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) redirect("/services");
  return null;
}
