import { BarRowsChart } from "@/components/charts/BarRowsChart";
import { formatVnd } from "@/components/revenue/revenue-format";
import type { RevenueSlice } from "@/lib/revenue/revenue.types";
import type { AdminDashboard } from "@/services/admin.api";
import { BentoCard } from "./BentoCard";

const TOP = 5;
// Canvas height matches the 44px text rows beside it (no inline styles).
const ROW_HEIGHTS = ["h-11", "h-22", "h-33", "h-44", "h-55"] as const;

type DashboardTopMechanicsProps = {
  slices: RevenueSlice[] | null | undefined;
  mechanics: AdminDashboard["mechanics"] | undefined;
  rangeLabel: string;
};

// Top mechanics by collected revenue in the selected range, as canvas
// bar rows with the name, receipts and rating printed beside each bar.
export function DashboardTopMechanics({
  slices,
  mechanics,
  rangeLabel,
}: DashboardTopMechanicsProps) {
  const top = [...(slices ?? [])]
    .filter((slice) => slice.key && slice.key !== "null")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP);
  const rows = top.map((slice) => {
    const info = mechanics?.[slice.key];
    return {
      ...slice,
      name: info?.name ?? `Thợ ${slice.key.slice(0, 6)}`,
      rating: info?.rating ?? null,
    };
  });

  return (
    <BentoCard label="Top thợ" tour="admin-dash-top">
      <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
        Top thợ
      </h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Theo doanh thu thu được · {rangeLabel}
      </p>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Chưa có thợ nào ghi nhận thu tiền trong kỳ.
        </p>
      ) : (
        <div className="mt-3 flex gap-3">
          <ol className="flex w-36 shrink-0 flex-col">
            {rows.map((row, index) => (
              <li
                key={row.key}
                className="flex h-11 items-center gap-2 text-[13px]"
              >
                <span className="w-4 font-extrabold text-zinc-500">
                  {index + 1}
                </span>
                <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">
                  {row.name}
                </span>
              </li>
            ))}
          </ol>
          <BarRowsChart
            values={rows.map((row) => row.amount)}
            label={rows
              .map((row) => `${row.name}: ${formatVnd(row.amount)}`)
              .join("; ")}
            className={`min-w-0 flex-1 ${ROW_HEIGHTS[rows.length - 1] ?? "h-55"}`}
          />
          <ul className="flex shrink-0 flex-col text-right">
            {rows.map((row) => (
              <li
                key={row.key}
                className="flex h-11 flex-col justify-center text-xs text-zinc-600 tabular-nums dark:text-zinc-400"
              >
                <span className="font-bold text-[#1E3A5F] dark:text-zinc-50">
                  {formatVnd(row.amount)}
                </span>
                <span>
                  {row.count} phiếu
                  {row.rating
                    ? ` · ${row.rating.toFixed(1).replace(".", ",")}★`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </BentoCard>
  );
}
