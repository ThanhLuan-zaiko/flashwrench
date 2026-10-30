"use client";

import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { BRAND_CHIP_ACTIVE, BRAND_CHIP_IDLE } from "@/components/ui/brand";
import type { ServiceCategoryItem } from "@/lib/catalog/service-catalog.types";

type PublicCatalogFilterProps = {
  categories: ServiceCategoryItem[];
  activeSlug: string | null;
  query: string;
  searchId: string;
  onQuery: (query: string) => void;
};

function tabHref(slug: string | null): string {
  return slug ? `/services/${encodeURIComponent(slug)}` : "/services";
}

const PILL_CLASSES =
  "flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:min-h-[44px] sm:px-4 sm:py-2 sm:text-sm duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:focus-visible:ring-zinc-100 motion-safe:active:scale-[0.99]";

const ACTIVE_PILL_CLASSES = BRAND_CHIP_ACTIVE;

const IDLE_PILL_CLASSES = BRAND_CHIP_IDLE;

// Category tabs are real links with one URL per tab so customers can share
// and revisit them. `scroll={false}` keeps the scroll position, and the
// parent shell stays mounted, so switching tabs re-renders instantly from
// the cached catalog without replaying the enter animation.
export function PublicCatalogFilter({
  categories,
  activeSlug,
  query,
  searchId,
  onQuery,
}: PublicCatalogFilterProps) {
  return (
    <div data-reveal className="flex flex-col gap-3">
      <div className="relative">
        <FiSearch
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        />
        <label htmlFor={searchId} className="sr-only">
          Tìm dịch vụ theo tên
        </label>
        <input
          id={searchId}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Tìm theo tên dịch vụ"
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white pr-3 pl-10 text-sm text-zinc-800 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] sm:h-12 sm:text-[15px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
      <div
        role="tablist"
        aria-label="Lọc theo loại hình"
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
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
    </div>
  );
}
