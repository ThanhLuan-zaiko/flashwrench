import type { ReactNode } from "react";

type StaffChartCardProps = {
  title: string;
  subtitle?: string;
  /** Headline number or legend on the right of the title. */
  aside?: ReactNode;
  isPending?: boolean;
  /** Message shown instead of the chart (empty data or a failed load). */
  empty?: string | null;
  children: ReactNode;
};

// Shared frame for the one chart at the top of each staff page: bordered
// surface, navy title, optional headline, and a pending/empty state.
export function StaffChartCard({
  title,
  subtitle,
  aside,
  isPending = false,
  empty = null,
  children,
}: StaffChartCardProps) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {aside && !isPending && <div className="shrink-0">{aside}</div>}
      </div>
      <div className="mt-3">
        {isPending ? (
          <div
            aria-busy="true"
            className="h-40 rounded-xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900"
          />
        ) : empty ? (
          <p className="py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

// Big navy number with a small caption, for the card's `aside` slot.
export function ChartHeadline({
  value,
  caption,
}: {
  value: string;
  caption: string;
}) {
  return (
    <p className="text-right">
      <span className="block text-2xl font-extrabold text-[#1E3A5F] tabular-nums dark:text-zinc-50">
        {value}
      </span>
      <span className="text-xs text-zinc-600 dark:text-zinc-400">
        {caption}
      </span>
    </p>
  );
}
