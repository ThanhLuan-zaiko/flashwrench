"use client";

import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { useMechanicStats } from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { MonthlyChart } from "./MonthlyChart";
import { RatingBreakdown } from "./RatingBreakdown";
import { ReviewList } from "./ReviewList";
import { StatsCounters } from "./StatsCounters";

// Bento root for performance: the four headline counters, a monthly
// completion/revenue chart, the star distribution and latest reviews.
export function StatsSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const query = useMechanicStats();

  const payload = query.data ?? null;
  const stats = payload?.stats ?? null;
  const monthly = payload?.monthly ?? [];
  const ratings = payload?.ratings ?? [];
  const reviews = payload?.reviews ?? [];

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      {query.isPending ? (
        <div
          className="flex items-center justify-center py-10"
          aria-live="polite"
          aria-busy="true"
        >
          <FiLoader
            aria-hidden="true"
            className="h-9 w-9 text-zinc-400 motion-safe:animate-spin dark:text-zinc-500"
          />
          <span className="sr-only">Đang tải thống kê hiệu suất</span>
        </div>
      ) : query.isError || !stats ? (
        <BentoCard label="Lỗi thống kê">
          <div className="flex flex-col items-center py-10 text-center">
            <FiAlertCircle
              aria-hidden="true"
              className="h-10 w-10 text-zinc-400"
            />
            <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Không tải được thống kê
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-4 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Tải lại
            </button>
          </div>
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
          <StatsCounters stats={stats} />
          <MonthlyChart monthly={monthly} />
          <RatingBreakdown ratings={ratings} total={stats.ratingCount} />
          <ReviewList reviews={reviews} />
        </div>
      )}
    </div>
  );
}
