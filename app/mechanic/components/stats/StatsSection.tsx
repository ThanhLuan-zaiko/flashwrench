"use client";

import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { useMechanicStats } from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useIncreaseToast } from "@/hooks/useIncreaseToast";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatVnd } from "../mechanic-format";
import { ActivityHeatmapCard } from "./ActivityHeatmapCard";
import { MechanicKpiRow } from "./MechanicKpiRow";
import { RatingBreakdown } from "./RatingBreakdown";
import { ReviewList } from "./ReviewList";
import { WeeklyIncomeCard } from "./WeeklyIncomeCard";

// Performance page laid out like the approved design: header with the
// "just collected" notice, KPI row, 7-day income + rating, 12-week
// heatmap, then the latest reviews. The mechanic's realtime topic
// refetches the stats and every canvas morphs to the new numbers.
export function StatsSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const query = useMechanicStats();
  const payload = query.data ?? null;
  const collected = useIncreaseToast(payload?.daily.weekRevenue);

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase dark:text-zinc-400">
            Thợ · Tuần này
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1E3A5F] sm:text-[28px] dark:text-zinc-50">
            Hiệu suất của bạn
          </h2>
        </div>
        <p role="status" className="min-h-10">
          {collected !== null && (
            <span className="flex items-center gap-2.5 rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-[13px] text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full bg-[#1E3A5F] dark:bg-zinc-100"
              />
              Vừa thu{" "}
              <b className="text-[#1E3A5F] dark:text-zinc-50">
                +{formatVnd(collected)}
              </b>
            </span>
          )}
        </p>
      </div>

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
      ) : query.isError || !payload ? (
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
        <>
          <MechanicKpiRow payload={payload} />
          <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
            <WeeklyIncomeCard daily={payload.daily} />
            <RatingBreakdown
              ratings={payload.ratings}
              total={payload.stats.ratingCount}
              average={payload.stats.ratingAvg}
              latest={payload.reviews[0]}
            />
            <ActivityHeatmapCard payload={payload} />
          </div>
          <ReviewList reviews={payload.reviews} />
        </>
      )}
    </div>
  );
}
