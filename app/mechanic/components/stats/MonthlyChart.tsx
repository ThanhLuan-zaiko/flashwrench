import type { MechanicMonthlyPoint } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatMonthLabel, formatVnd } from "../mechanic-format";

// Monthly completion bars, pure Tailwind: the height comes from a fixed
// class table (no inline styles, no keyframes), months oldest first.
const BAR_HEIGHTS = [
  "h-1",
  "h-2",
  "h-3",
  "h-4",
  "h-5",
  "h-6",
  "h-7",
  "h-8",
  "h-10",
  "h-12",
  "h-14",
  "h-16",
  "h-20",
  "h-24",
] as const;

function barHeightClass(value: number, max: number): string {
  if (max <= 0 || value <= 0) return BAR_HEIGHTS[0] as string;
  const step = Math.min(
    BAR_HEIGHTS.length - 1,
    Math.round((value / max) * (BAR_HEIGHTS.length - 1)),
  );
  return BAR_HEIGHTS[step] as string;
}

export function MonthlyChart({ monthly }: { monthly: MechanicMonthlyPoint[] }) {
  const maxCompleted = Math.max(1, ...monthly.map((point) => point.completed));
  const totalRevenue = monthly.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <BentoCard label="Đơn hoàn thành theo tháng" className="sm:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            6 tháng gần nhất
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tổng {formatVnd(totalRevenue)} từ đơn đã xong
          </p>
        </div>
      </div>
      {monthly.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-zinc-200 px-3 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Chưa có dữ liệu theo tháng.
        </p>
      ) : (
        <div
          role="img"
          aria-label={monthly
            .map(
              (point) =>
                `${formatMonthLabel(point.month)}: ${point.completed} đơn, ${formatVnd(point.revenue)}`,
            )
            .join("; ")}
          className="mt-4 flex h-32 items-end gap-2"
        >
          {monthly.map((point) => (
            <div
              key={point.month}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {point.completed}
              </span>
              <span
                aria-hidden="true"
                className={`w-full rounded-t-lg bg-zinc-900 motion-safe:transition-all motion-safe:duration-200 dark:bg-zinc-100 ${barHeightClass(point.completed, maxCompleted)}`}
              />
              <span className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {formatMonthLabel(point.month)}
              </span>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
