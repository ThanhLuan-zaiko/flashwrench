"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { IncomeSection } from "./IncomeSection";
import { INCOME_TABS, incomeTabHref, isIncomeTab } from "./income-tabs";

// Mount-once shell for /mechanic/income/[state]: reads the active tab from
// the URL so tab switches and /page/N flips never remount the section or
// replay its reveal animation. Unknown slugs get a guidance panel.
export function IncomeRouteShell() {
  const params = useParams();
  const rawState = params.state;
  const state = Array.isArray(rawState)
    ? (rawState[0] ?? null)
    : (rawState ?? null);

  if (!isIncomeTab(state)) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Trạng thái giao dịch này không tồn tại
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Hãy chọn một bộ lọc thu nhập bên dưới.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {INCOME_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={incomeTabHref(tab.id)}
                scroll={false}
                prefetch
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  return <IncomeSection key={state} state={state} />;
}
