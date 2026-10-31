"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiArrowRight } from "react-icons/fi";
import { useChapterMotion } from "@/hooks/useChapterMotion";
import type { PartItem } from "@/lib/parts/parts.types";
import { MaskLines } from "../MaskLines";
import { HomeProductCard } from "./HomeProductCard";

// Parts chapter: real in-stock parts as large photo tiles on the page
// surface. Hidden entirely when the catalog has nothing to show.
export function HomeProductsBento({ items }: { items: PartItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  useChapterMotion(rootRef);
  if (items.length === 0) return null;

  return (
    <section ref={rootRef} id="san-pham" aria-label="Phụ tùng nổi bật">
      <div className="w-full px-4 pb-12 sm:px-6 md:pb-20 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
              Phụ tùng
            </p>
            <MaskLines
              lines={["Phụ tùng chính hãng,", "sẵn kho"]}
              className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl dark:text-zinc-50"
            />
          </div>
          <Link
            href="/products"
            className="flex min-h-11 items-center gap-1.5 self-start text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] md:self-auto dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
          >
            Xem tất cả phụ tùng
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <span
          data-rule
          aria-hidden="true"
          className="mt-6 block h-px origin-left bg-zinc-200 md:mt-8 dark:bg-zinc-800"
        />
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-8 lg:grid-cols-4">
          {items.map((part) => (
            <HomeProductCard key={part.id} part={part} />
          ))}
        </ul>
      </div>
    </section>
  );
}
