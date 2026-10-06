import Link from "next/link";
import type { RevenueRange } from "@/lib/revenue/revenue-period";
import { REVENUE_RANGE_TABS } from "./revenue-format";

type RangeTab = { id: RevenueRange; label: string };

type RevenueRangeTabsProps = {
  basePath: string;
  active: RevenueRange;
  tabs?: readonly RangeTab[];
  /** Spotlight-tour anchor; renders as `data-tour` on the nav. */
  tour?: string;
};

// One URL per range so a switch is a fast cached navigation, never a
// remount — same contract as the bookings status tabs. Reports with fewer
// ranges (customer mix: day/week/month) pass their own `tabs` subset.
export function RevenueRangeTabs({
  basePath,
  active,
  tabs = REVENUE_RANGE_TABS,
  tour,
}: RevenueRangeTabsProps) {
  return (
    <nav
      aria-label="Khoảng báo cáo"
      data-tour={tour}
      className="flex flex-wrap gap-1.5"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`${basePath}/${tab.id}`}
            scroll={false}
            prefetch
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-[44px] items-center rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
