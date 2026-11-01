"use client";

import Image from "next/image";
import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import { ProductChapterHead } from "./ProductChapterHead";

type TrustItem = {
  title: string;
  hint: string;
  illustration: string;
};

// Commitments chapter under the hero: three promises as ruled columns (rows on
// phones), each with a large isometric drawing. No bordered cards.
export function ProductTrustStrip({ brand }: { brand: string }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  const items: TrustItem[] = [
    {
      title: "Hàng chính hãng",
      hint: `Sản phẩm chính hãng từ ${brand}.`,
      illustration: "/images/isometric/package.svg",
    },
    {
      title: "Thợ lắp tận nơi",
      hint: "Đặt thợ lưu động thay linh kiện ngay tại chỗ của bạn.",
      illustration: "/images/isometric/van.svg",
    },
    {
      title: "Đặt lịch dễ dàng",
      hint: "Chọn giờ phù hợp và theo dõi thợ trên bản đồ.",
      illustration: "/images/isometric/wrench.svg",
    },
  ];

  return (
    <section
      ref={rootRef}
      aria-label="Cam kết khi mua hàng"
      className="flex flex-col gap-8 pt-12 md:pt-16"
    >
      <ProductChapterHead title="Cam kết khi mua hàng" />
      <ul className="grid grid-cols-1 divide-y divide-zinc-200 md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-zinc-800">
        {items.map((item) => (
          <li
            key={item.title}
            data-chapter-row
            className="flex items-center gap-4 py-5 md:px-6 md:py-2 md:first:pl-0"
          >
            <Image
              src={item.illustration}
              alt=""
              width={96}
              height={96}
              className="h-20 w-20 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#1E3A5F] dark:text-zinc-50">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {item.hint}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
