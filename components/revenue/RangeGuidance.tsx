import Link from "next/link";
import type { RevenueRange } from "@/lib/revenue/revenue-period";
import { REVENUE_RANGE_TABS } from "./revenue-format";

type RangeGuidanceProps = {
  basePath: string;
};

// Unknown range slug: guidance panel per AGENTS 7.1 — never silently fall
// back to another range's data.
export function RangeGuidance({ basePath }: RangeGuidanceProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Khoảng báo cáo này không tồn tại
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Hãy chọn một khoảng bên dưới để xem doanh thu.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {REVENUE_RANGE_TABS.map((tab: { id: RevenueRange; label: string }) => (
          <Link
            key={tab.id}
            href={`${basePath}/${tab.id}`}
            scroll={false}
            prefetch
            className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
