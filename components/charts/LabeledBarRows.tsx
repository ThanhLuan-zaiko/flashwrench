import { BarRowsChart } from "./BarRowsChart";

// Canvas height matches the 44px text rows beside it (no inline styles).
const ROW_HEIGHTS = [
  "h-11",
  "h-22",
  "h-33",
  "h-44",
  "h-55",
  "h-66",
  "h-77",
  "h-88",
] as const;

export type BarRow = {
  key: string;
  label: string;
  value: number;
  note: string;
};

type LabeledBarRowsProps = {
  rows: BarRow[];
  label: string;
};

// Name column, canvas bar rows and a value column, aligned row by row.
export function LabeledBarRows({ rows, label }: LabeledBarRowsProps) {
  const height = ROW_HEIGHTS[Math.min(rows.length, ROW_HEIGHTS.length) - 1];
  return (
    <div className="flex gap-3">
      <ul className="flex w-32 shrink-0 flex-col sm:w-40">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex h-11 items-center truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-200"
          >
            <span className="truncate">{row.label}</span>
          </li>
        ))}
      </ul>
      <BarRowsChart
        values={rows.map((row) => row.value)}
        label={label}
        className={`min-w-0 flex-1 ${height ?? "h-88"}`}
      />
      <ul className="flex shrink-0 flex-col text-right">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex h-11 items-center justify-end text-xs font-bold text-[#1E3A5F] tabular-nums dark:text-zinc-50"
          >
            {row.note}
          </li>
        ))}
      </ul>
    </div>
  );
}
