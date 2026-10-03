"use client";

import type { IconType } from "react-icons";
import { useCountUp } from "@/hooks/useCountUp";

// 1x1 bento stat: a number that counts up on first paint plus a short
// label. Numbers arrive as integers; `format` shapes them (plain count or
// VND).
export function WalletStatTile({
  icon: Icon,
  value,
  format,
  label,
}: {
  icon: IconType;
  value: number;
  format: (value: number) => string;
  label: string;
}) {
  const countRef = useCountUp(value, format);
  return (
    <div
      data-reveal
      className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </p>
      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <span ref={countRef}>{format(value)}</span>
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      </div>
    </div>
  );
}
