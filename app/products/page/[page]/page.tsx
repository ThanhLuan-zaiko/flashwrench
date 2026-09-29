import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";

type PageParams = { params: Promise<{ page: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Sản phẩm — Trang ${page} | FlashWrench`,
    description:
      "Mua linh kiện ô tô, xe máy chính hãng với giá công khai và tồn kho cập nhật trực tiếp.",
  };
}

// Metadata-only leaf: the /products layout shell renders the landing and
// reads the page segment itself. Page 1 canonicalizes to the bare root.
export default async function ProductsShelfPage({ params }: PageParams) {
  const { page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) redirect("/products");
  return null;
}
