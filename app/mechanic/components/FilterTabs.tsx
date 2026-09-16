"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { IconType } from "react-icons";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { prefersReducedMotion, tabScrollOptions } from "./tab-scroll";

export type FilterTabDef = {
  id: string;
  label: string;
  href: string;
  icon: IconType;
};

type FilterTabsProps = {
  tabs: FilterTabDef[];
  activeId: string;
  ariaLabel: string;
  counts?: Record<string, number>;
};

// Scrollable pill strip shared by the mechanic workspace filters. One URL
// per tab (Next Link), monochrome active state, optional live counts.
// Horizontal scroll keeps every tab reachable on 360px screens without
// pushing the content below down. The active pill scrolls itself into the
// center of the strip on mount and on every tab switch.
export function FilterTabs({
  tabs,
  activeId,
  ariaLabel,
  counts,
}: FilterTabsProps) {
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    itemRefs.current
      .get(activeId)
      ?.scrollIntoView(tabScrollOptions(prefersReducedMotion()));
  }, [activeId]);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-2 overflow-x-auto pb-1 ${SCROLLBAR_CLASSES}`}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        const Icon = tab.icon;
        const count = counts?.[tab.id];
        return (
          <Link
            key={tab.id}
            ref={(node) => {
              if (node) itemRefs.current.set(tab.id, node);
              else itemRefs.current.delete(tab.id);
            }}
            href={tab.href}
            role="tab"
            aria-selected={selected}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-95 ${
              selected
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            }`}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {tab.label}
            {count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                  selected
                    ? "bg-white/20 text-white dark:bg-zinc-900/10 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
