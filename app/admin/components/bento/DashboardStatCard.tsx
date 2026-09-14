import type { IconType } from "react-icons";
import { BentoCard } from "./BentoCard";

export type DashboardStat = {
  id: string;
  label: string;
  hint: string;
  icon: IconType;
};

// Single 1x1 stat cell. Value stays placeholder until stats API lands.
export function DashboardStatCard({ stat }: { stat: DashboardStat }) {
  const Icon = stat.icon;
  return (
    <BentoCard label={stat.label}>
      <p className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {stat.label}
        </span>
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        —
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {stat.hint}
      </p>
    </BentoCard>
  );
}
