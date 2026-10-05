import type { ReactNode } from "react";
import { FiTag } from "react-icons/fi";

type VoucherOfferTicketProps = {
  title: string;
  name: string;
  meta: string[];
  badge?: string;
  muted?: boolean;
  selected?: boolean;
  action?: ReactNode;
  footer?: ReactNode;
};

// One offer row inside the voucher picker: a ticket glyph, the saving
// headline, campaign name and meta, plus an action on the right.
// Selected gets a strong border, near-misses render muted.
export function VoucherOfferTicket({
  title,
  name,
  meta,
  badge,
  muted = false,
  selected = false,
  action,
  footer,
}: VoucherOfferTicketProps) {
  const border = selected
    ? "border-zinc-900 dark:border-zinc-100"
    : muted
      ? "border-dashed border-zinc-200 dark:border-zinc-800"
      : "border-zinc-200 dark:border-zinc-800";
  return (
    <div
      className={`rounded-xl border p-3 ${border} ${muted ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <FiTag className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
            {badge && (
              <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                {badge}
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-700 dark:text-zinc-300">
            {name}
          </p>
          {meta.length > 0 && (
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              {meta.join(" · ")}
            </p>
          )}
        </div>
        {action}
      </div>
      {footer && (
        <p className="mt-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {footer}
        </p>
      )}
    </div>
  );
}
