import type { IconType } from "react-icons";
import { BentoCard } from "./BentoCard";

export type DashboardStat = {
  id: string;
  label: string;
  hint: string;
  icon: IconType;
};

type DashboardStatCardProps = {
  stat: DashboardStat;
  value?: string;
  isPending?: boolean;
  tour?: string;
};

// Single 1x1 stat cell fed by the admin dashboard endpoint.
export function DashboardStatCard({
  stat,
  value,
  isPending,
  tour,
}: DashboardStatCardProps) {
  const Icon = stat.icon;
  return (
    <BentoCard label={stat.label} tour={tour}>
      <p className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {stat.label}
        </span>
      </p>
      <p
        aria-busy={isPending ?? false}
        className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        {isPending ? (
          <span className="motion-safe:animate-pulse">…</span>
        ) : (
          (value ?? "—")
        )}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {stat.hint}
      </p>
    </BentoCard>
  );
}
