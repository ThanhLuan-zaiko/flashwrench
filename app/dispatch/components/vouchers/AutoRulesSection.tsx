"use client";

import { useAutoRules, useVoucherProgress } from "@/hooks/useVouchers";
import { AutoRuleForm } from "./AutoRuleForm";
import { AutoRuleList } from "./AutoRuleList";
import { NearMilestoneList } from "./NearMilestoneList";

export function AutoRulesSection() {
  const rules = useAutoRules(true);
  const progress = useVoucherProgress(true);

  return (
    <section className="flex flex-col gap-3">
      <header>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
          Tự động phát theo quy tắc
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Hệ thống tự phát voucher khi khách đạt điều kiện — nhân viên chỉ cần
          giám sát.
        </p>
      </header>
      <AutoRuleForm />
      {rules.isPending ? (
        <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 motion-safe:animate-pulse dark:border-zinc-800 dark:text-zinc-400">
          Đang tải quy tắc…
        </p>
      ) : rules.isError ? (
        <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Không tải được quy tắc.
        </p>
      ) : (
        <AutoRuleList rules={rules.data ?? []} />
      )}
      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
        Khách sắp đạt mốc
      </h3>
      {progress.isPending ? (
        <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 motion-safe:animate-pulse dark:border-zinc-800 dark:text-zinc-400">
          Đang tải tiến độ…
        </p>
      ) : progress.isError ? (
        <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Không tải được tiến độ khách hàng.
        </p>
      ) : (
        progress.data && <NearMilestoneList progress={progress.data} />
      )}
    </section>
  );
}
