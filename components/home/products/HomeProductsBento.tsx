"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { PartItem } from "@/lib/parts/parts.types";
import { HomeProductCard } from "./HomeProductCard";

// Storefront strip of real in-stock parts. Hidden entirely when the catalog
// has nothing to show, so the page never carries an empty shell.
export function HomeProductsBento({ items }: { items: PartItem[] }) {
  const rootRef = useBentoReveal<HTMLElement>();
  if (items.length === 0) return null;

  return (
    <section ref={rootRef} id="san-pham" aria-label="Phụ tùng nổi bật">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 md:pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div data-reveal className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#1E3A5F] uppercase dark:text-zinc-400">
              Phụ tùng
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Phụ tùng chính hãng, sẵn kho.
            </h2>
          </div>
          <Link
            data-reveal
            href="/products"
            className="flex min-h-[44px] items-center gap-1.5 self-start text-sm font-semibold text-zinc-900 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 md:self-auto dark:text-zinc-50"
          >
            Xem tất cả phụ tùng
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {items.map((part) => (
            <HomeProductCard key={part.id} part={part} />
          ))}
        </div>
      </div>
    </section>
  );
}
