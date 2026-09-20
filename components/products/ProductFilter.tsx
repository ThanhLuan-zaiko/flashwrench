"use client";

import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import type { PartCategoryItem } from "@/lib/parts/parts.types";

type ProductFilterProps = {
  categories: PartCategoryItem[];
  activeSlug: string | null;
  query: string;
  searchId: string;
  onQuery: (query: string) => void;
};

function tabHref(slug: string | null): string {
  return slug ? `/products?cat=${encodeURIComponent(slug)}` : "/products";
}

const PILL_CLASSES =
  "flex min-h-[44px] items-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99]";

const ACTIVE_PILL_CLASSES =
  "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900";

const IDLE_PILL_CLASSES =
  "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

// Category tabs are real links with one URL per tab (?cat=<slug>) so a
// filtered shelf stays shareable and the back button works. The landing
// stays mounted across query changes, so switching tabs is instant and
// never replays the enter animation.
export function ProductFilter({
  categories,
  activeSlug,
  query,
  searchId,
  onQuery,
}: ProductFilterProps) {
  return (
    <div data-reveal className="flex flex-col gap-2.5">
      <div
        role="tablist"
        aria-label="Lọc theo danh mục"
        className="flex flex-wrap gap-1.5"
      >
        <Link
          href={tabHref(null)}
          scroll={false}
          prefetch
          role="tab"
          aria-selected={activeSlug === null}
          className={`${PILL_CLASSES} ${
            activeSlug === null ? ACTIVE_PILL_CLASSES : IDLE_PILL_CLASSES
          }`}
        >
          Tất cả
        </Link>
        {categories.map((category) => {
          const active = activeSlug === category.slug;
          return (
            <Link
              key={category.id}
              href={tabHref(category.slug)}
              scroll={false}
              prefetch
              role="tab"
              aria-selected={active}
              className={`${PILL_CLASSES} ${
                active ? ACTIVE_PILL_CLASSES : IDLE_PILL_CLASSES
              }`}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
      <div className="relative">
        <FiSearch
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        />
        <label htmlFor={searchId} className="sr-only">
          Tìm sản phẩm theo tên, hãng hoặc mã
        </label>
        <input
          id={searchId}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Tìm theo tên, hãng hoặc mã linh kiện…"
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white pr-3 pl-10 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
}
