"use client";

import Link from "next/link";
import { RESCUE_ISSUE_OPTIONS } from "@/components/rescue/rescue-constants";
import { useNow } from "@/hooks/useNow";
import type { PulseOpenRescue } from "@/lib/dispatch/dispatch-pulse.types";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import {
  formatWait,
  RESCUE_STATUS_LABELS,
  RESCUE_WAIT_ALERT_MS,
  rescueCode,
} from "./pulse-format";

const ISSUE_LABELS = new Map(
  RESCUE_ISSUE_OPTIONS.map((option) => [option.value, option.label]),
);

type PulseRescueListProps = {
  rescues: PulseOpenRescue[];
  total: number;
};

// Open rescues, longest wait first, each with a live timer that ticks
// every second and turns red past ten minutes.
export function PulseRescueList({ rescues, total }: PulseRescueListProps) {
  const now = useNow(1000);

  return (
    <BentoCard label="Cứu hộ đang mở" className="lg:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
          Cứu hộ đang mở
        </h3>
        <Link
          href="/dispatch/rescue/open"
          className="text-xs font-semibold text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
        >
          {total > rescues.length ? `Xem tất cả ${total} ca` : "Mở bảng cứu hộ"}
        </Link>
      </div>
      {rescues.length === 0 ? (
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Không có yêu cầu cứu hộ nào đang mở.
        </p>
      ) : (
        <ul className="mt-2">
          {rescues.map((rescue) => {
            const wait = now - new Date(rescue.createdAt).getTime();
            const late = wait > RESCUE_WAIT_ALERT_MS;
            return (
              <li
                key={rescue.requestId}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t border-zinc-100 py-2.5 sm:grid-cols-[96px_minmax(0,1fr)_128px_84px] dark:border-zinc-900"
              >
                <span className="font-mono text-[13px] font-bold text-[#1E3A5F] dark:text-zinc-100">
                  {rescueCode(rescue.requestId)}
                </span>
                <span className="truncate text-[13px] text-zinc-700 dark:text-zinc-300">
                  {ISSUE_LABELS.get(rescue.issueType ?? "") ?? "Sự cố khác"}
                  {rescue.priority === "high" ? " · ưu tiên" : ""}
                </span>
                <span className="col-start-2 row-start-2 text-xs text-zinc-600 sm:col-start-auto sm:row-start-auto dark:text-zinc-400">
                  {RESCUE_STATUS_LABELS[rescue.status] ?? rescue.status}
                </span>
                <span
                  className={`col-start-3 row-span-2 row-start-1 justify-self-end text-[15px] font-extrabold tabular-nums sm:col-start-auto sm:row-span-1 sm:row-start-auto ${
                    late
                      ? "text-red-600 dark:text-red-400"
                      : "text-[#1E3A5F] dark:text-zinc-50"
                  }`}
                >
                  <span className="sr-only">Đã chờ </span>
                  {formatWait(wait)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </BentoCard>
  );
}
