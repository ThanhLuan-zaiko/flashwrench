"use client";

import { useCountUp } from "@/hooks/useCountUp";

// One stat row of the owner's wallet: a label on the left and a number that
// counts up on first paint on the right. Numbers arrive as integers; `format`
// shapes them (plain count or VND).
export function WalletStatTile({
  value,
  format,
  label,
}: {
  value: number;
  format: (value: number) => string;
  label: string;
}) {
  const countRef = useCountUp(value, format);
  return (
    <div className="flex items-baseline justify-between gap-4 py-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        <span ref={countRef}>{format(value)}</span>
      </p>
    </div>
  );
}
