"use client";

import { useState } from "react";
import { FiCopy } from "react-icons/fi";
import type { NearMilestoneEntry } from "@/lib/vouchers/auto-rule.types";
import type { VoucherProgress } from "@/services/vouchers.api";
import { describeNearMilestone } from "./auto-rule-format";

// The dispatcher sees who is one step below a milestone and can still hand
// out a voucher early — the UUID copy button feeds the manual grant form.
function MilestoneRow({ entry }: { entry: NearMilestoneEntry }) {
  const [copied, setCopied] = useState(false);

  async function copyUserId() {
    try {
      await navigator.clipboard.writeText(entry.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
          {entry.ruleName}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {describeNearMilestone(entry)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void copyUserId()}
        className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 font-mono text-xs text-zinc-600 motion-safe:transition-colors dark:border-zinc-700 dark:text-zinc-300"
        aria-label={`Sao chép ID khách ${entry.userId}`}
        title={entry.userId}
      >
        <FiCopy aria-hidden size={14} />
        {copied ? "Đã chép" : `${entry.userId.slice(0, 8)}…`}
      </button>
    </li>
  );
}

export function NearMilestoneList({ progress }: { progress: VoucherProgress }) {
  if (progress.entries.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Chưa có khách nào sắp đạt mốc thưởng.
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {progress.entries.map((entry) => (
          <MilestoneRow key={`${entry.ruleId}:${entry.userId}`} entry={entry} />
        ))}
      </ul>
      <p className="border-t border-zinc-100 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Đã quét {progress.scannedCustomers} khách
        {progress.truncated ? " — chỉ hiển thị phần đầu" : ""}
      </p>
    </div>
  );
}
