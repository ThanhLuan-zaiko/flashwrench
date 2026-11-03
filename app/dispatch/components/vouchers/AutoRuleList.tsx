"use client";

import { FiZap } from "react-icons/fi";
import { StaffEmptyState } from "@/components/staff/StaffEmptyState";
import { STAFF_ART } from "@/components/staff/staff-art";
import { useToggleAutoRule } from "@/hooks/useVouchers";
import type { VoucherAutoRule } from "@/lib/vouchers/auto-rule.types";
import { describeRule } from "./auto-rule-format";

export function AutoRuleList({ rules }: { rules: VoucherAutoRule[] }) {
  const toggle = useToggleAutoRule();

  if (rules.length === 0) {
    return (
      <StaffEmptyState
        art={STAFF_ART.clipboard}
        title="Chưa có quy tắc tự động"
        hint="Tạo quy tắc để voucher tự phát khi khách đạt điều kiện."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rules.map((rule, index) => (
        <li
          key={rule.id}
          className={`flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 ${
            index === rules.length - 1 && rules.length % 2 === 1
              ? "md:col-span-2"
              : ""
          }`}
        >
          <FiZap
            aria-hidden
            size={18}
            className="shrink-0 text-zinc-500 dark:text-zinc-300"
          />
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
            className="flex min-h-[44px] shrink-0 items-center rounded-xl border border-[#1E3A5F] px-3 text-xs font-semibold text-[#1E3A5F] disabled:opacity-50 motion-safe:transition-colors dark:border-zinc-100 dark:text-zinc-100"
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
