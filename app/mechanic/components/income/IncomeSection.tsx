"use client";

import { useMemo, useState } from "react";
import { FiDollarSign, FiLoader, FiTrendingUp } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useMechanicIncome } from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { MechanicIncomeEntry } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import {
  clampMechanicPage,
  formatVnd,
  MECHANIC_PAGE_SIZE,
  pageCountOf,
  pageRangeLabel,
  paginateMechanicItems,
} from "../mechanic-format";
import { IncomeHistory } from "./IncomeHistory";

const PERIOD_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "paid", label: "Đã thu" },
  { value: "pending", label: "Chờ thu" },
  { value: "refunded", label: "Đã hoàn" },
];

// Bento root for income: revenue counters by day/week/month plus the
// transaction history with a state filter and paging.
export function IncomeSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const query = useMechanicIncome();

  const summary = query.data?.summary ?? null;
  const entries = useMemo<MechanicIncomeEntry[]>(
    () => query.data?.entries ?? [],
    [query.data],
  );
  const filtered = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((entry) => entry.state === filter),
    [entries, filter],
  );
  const safePage = clampMechanicPage(page, filtered.length);
  const visible = useMemo(
    () => paginateMechanicItems(filtered, safePage),
    [filtered, safePage],
  );

  const pickFilter = (value: string) => {
    setFilter(value);
    setPage(0);
  };

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
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Thu nhập thợ xe"
        title="Tiền về rõ từng đồng."
        subtitle="Doanh thu theo ngày, tuần, tháng và lịch sử từng giao dịch đã thu."
      />
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
            <div
              role="tablist"
              aria-label="Lọc giao dịch theo trạng thái"
              className="flex flex-wrap gap-1.5"
            >
              {PERIOD_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.value}
                  onClick={() => pickFilter(item.value)}
                  className={`min-h-[44px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors duration-200 ${
                    filter === item.value
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
