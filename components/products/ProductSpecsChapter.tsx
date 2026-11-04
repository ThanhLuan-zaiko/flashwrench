"use client";

import { useRef } from "react";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { PartItem } from "@/lib/parts/parts.types";
import { ProductChapterHead } from "./ProductChapterHead";

type ProductSpecsChapterProps = {
  specs: PartItem["specs"];
  carModels: string[];
};

// Specifications and compatible models as ruled chapters: spec rows split by
// hairlines (two columns from md), then the compatible models as plain text.
export function ProductSpecsChapter({
  specs,
  carModels,
}: ProductSpecsChapterProps) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);

  const entries = Object.entries(specs ?? {});
  if (entries.length === 0 && carModels.length === 0) return null;

  return (
    <section
      ref={rootRef}
      aria-label="Thông số và xe tương thích"
      className="flex flex-col gap-12 pt-12 md:gap-16 md:pt-16"
    >
      {entries.length > 0 && (
        <div className="flex flex-col gap-8">
          <ProductChapterHead title="Thông số kỹ thuật" />
          <dl className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
            {entries.map(([key, value]) => (
              <div
                key={key}
                data-chapter-row
                className="flex items-baseline justify-between gap-4 border-b border-zinc-200 py-3 dark:border-zinc-800"
              >
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                  {key}
                </dt>
                <dd className="text-right text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {carModels.length > 0 && (
        <div className="flex flex-col gap-4">
          <ProductChapterHead title="Xe tương thích" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Kiểm tra dòng xe trước khi đặt mua.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {carModels.map((model) => (
              <li
                key={model}
                data-chapter-row
                className="text-base font-bold text-zinc-900 dark:text-zinc-50"
              >
                {model}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
