"use client";

import { useMemo, useState } from "react";
import { FiDollarSign, FiLoader, FiTrendingUp } from "react-icons/fi";
import { useMechanicIncome } from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { MechanicIncomeEntry } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { FilterTabs } from "../FilterTabs";
import {
  clampMechanicPage,
  formatVnd,
  MECHANIC_PAGE_SIZE,
  pageCountOf,
  pageRangeLabel,
  paginateMechanicItems,
} from "../mechanic-format";
import { IncomeHistory } from "./IncomeHistory";
import { INCOME_TABS, type IncomeTab } from "./income-tabs";

// Bento root for income: revenue counters by day/week/month plus the
// transaction history with a state filter and paging.
// Active tab comes from the route (one URL per tab) so links stay
// shareable and the browser back button works.
export function IncomeSection({ state }: { state: IncomeTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [page, setPage] = useState(0);
  const query = useMechanicIncome();

  const summary = query.data?.summary ?? null;
  const entries = useMemo<MechanicIncomeEntry[]>(
    () => query.data?.entries ?? [],
    [query.data],
  );
  const filtered = useMemo(
    () =>
      state === "all"
        ? entries
        : entries.filter((entry) => entry.state === state),
    [entries, state],
  );
  const safePage = clampMechanicPage(page, filtered.length);
  const visible = useMemo(
    () => paginateMechanicItems(filtered, safePage),
    [filtered, safePage],
  );
  const counts = useMemo<Record<string, number> | undefined>(() => {
    if (query.isPending || !query.data) return undefined;
    const tally: Record<string, number> = {
      all: entries.length,
      paid: 0,
      pending: 0,
      refunded: 0,
    };
    for (const entry of entries) {
      tally[entry.state] = (tally[entry.state] ?? 0) + 1;
    }
    return tally;
  }, [entries, query.data, query.isPending]);

  const counters = [
    {
      id: "today",
      label: "Hôm nay",
      value: summary ? formatVnd(summary.today) : "…",
      hint: "Tiền đã thu trong ngày",
      icon: FiDollarSign,
    },
    {
      id: "week",
      label: "Tuần này",
      value: summary ? formatVnd(summary.week) : "…",
      hint: "Từ thứ Hai tới nay",
      icon: FiDollarSign,
    },
    {
      id: "month",
      label: "Tháng này",
      value: summary ? formatVnd(summary.month) : "…",
      hint: "Tiền đã thu trong tháng",
      icon: FiTrendingUp,
    },
    {
      id: "pending",
      label: "Chờ thu",
      value: summary ? formatVnd(summary.pendingTotal) : "…",
      hint: summary ? `${summary.pendingCount} đơn chưa thu` : "Đơn chưa thu",
      icon: FiLoader,
    },
  ];

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {counters.map((stat) => {
          const Icon = stat.icon;
          return (
            <BentoCard key={stat.id} label={stat.label}>
              <p className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {stat.label}
                </span>
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {stat.hint}
              </p>
            </BentoCard>
          );
        })}
        <BentoCard
          label="Lịch sử giao dịch"
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Lịch sử giao dịch
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {summary
                  ? `Tổng đã thu mọi thời gian ${formatVnd(summary.lifetime)} · ${summary.paidCount} giao dịch`
                  : "Đang tải lịch sử…"}
              </p>
            </div>
            <FilterTabs
              tabs={INCOME_TABS}
              activeId={state}
              ariaLabel="Lọc giao dịch theo trạng thái"
              counts={counts}
            />
          </div>
          <IncomeHistory
            isPending={query.isPending}
            isError={query.isError}
            visible={visible}
            page={safePage}
            pageCount={pageCountOf(filtered.length, MECHANIC_PAGE_SIZE)}
            range={pageRangeLabel(safePage, filtered.length)}
            total={filtered.length}
            truncated={query.data?.truncated ?? false}
            onPage={setPage}
            onRetry={() => void query.refetch()}
          />
        </BentoCard>
      </div>
    </div>
  );
}
