"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ServicesSection } from "../ServicesSection";
import { CATALOG_TABS, isCatalogTab } from "./catalog-tabs";

// Mounted once by the /admin/services layout, so it survives tab switches
// between categories, prices and trash. The tab comes from the URL on every
// navigation: dialog and filter state is reused, and the enter animation
// never replays for a mere tab switch.
export function CatalogRouteShell() {
  const params = useParams();
  const raw = params.tab;
  const tab = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);

  if (!isCatalogTab(tab)) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Nhóm quản lý này không tồn tại
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Hãy chọn một nhóm quản lý bên dưới để tiếp tục.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {CATALOG_TABS.map((entry) => {
              const EntryIcon = entry.icon;
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  scroll={false}
                  prefetch
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <EntryIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {entry.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <ServicesSection tab={tab} />;
}
