"use client";

import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";
import { MaskLines } from "../MaskLines";
import { CategoryCard } from "./CategoryCard";

// Service categories chapter: the covers and descriptions set in
// /admin/services/categories as cards, each linking to its /services tab.
// Data is read server-side; with no live category the section hides.
export function CategoriesChapter({ items }: { items: ServiceCategoryItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);
  if (items.length === 0) return null;

  return (
    <section
      ref={rootRef}
      aria-label="Loại hình dịch vụ"
      className="mx-auto max-w-7xl w-full px-4 pt-12 sm:px-6 md:pt-12 lg:px-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
            Loại hình
          </p>
          <MaskLines
            lines={["Chọn loại hình,", "rồi chọn dịch vụ"]}
            className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50"
          />
        </div>
        <p className="max-w-sm text-base text-zinc-600 dark:text-zinc-400">
          Mỗi loại hình gom các dịch vụ cùng cách làm. Chọn một loại để xem giá
          từng dịch vụ.
        </p>
      </div>
      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 md:gap-6 lg:grid-cols-3">
        {items.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </ul>
    </section>
  );
}
