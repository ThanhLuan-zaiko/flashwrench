"use client";

import { FiZap } from "react-icons/fi";
import { useToggleAutoRule } from "@/hooks/useVouchers";
import type { VoucherAutoRule } from "@/lib/vouchers/auto-rule.types";
import { describeRule } from "./auto-rule-format";

export function AutoRuleList({ rules }: { rules: VoucherAutoRule[] }) {
  const toggle = useToggleAutoRule();

  if (rules.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Chưa có quy tắc tự động nào. Tạo quy tắc để voucher tự phát khi khách
        đạt điều kiện.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
            <FiZap aria-hidden size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {rule.name}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {describeRule(rule)}
              {rule.campaignName ? ` · ${rule.campaignName}` : ""}
              {rule.campaignName ? "" : " · Chiến dịch đã xoá"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
              Đã phát {rule.grantedCount} lượt
            </p>
          </div>
          <button
            type="button"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate({ ruleId: rule.id, isActive: !rule.isActive })
            }
            className="flex min-h-[44px] shrink-0 items-center rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 disabled:opacity-50 motion-safe:transition-colors dark:border-zinc-700 dark:text-zinc-200"
            aria-label={
              rule.isActive
                ? `Tắt quy tắc ${rule.name}`
                : `Bật quy tắc ${rule.name}`
            }
          >
            {rule.isActive ? "Tắt" : "Bật"}
          </button>
        </li>
      ))}
    </ul>
  );
}
