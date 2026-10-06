"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiLifeBuoy,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { RESCUE_ISSUE_OPTIONS } from "@/components/rescue/rescue-constants";
import {
  rescueStatusBadgeClass,
  rescueStatusLabel,
} from "@/components/rescue/rescue-format";
import { useMyRescues, useMyRescuesRealtime } from "@/hooks/rescue";
import { formatDateTime } from "@/lib/datetime/format";
import { HistoryRescueDialog } from "./HistoryRescueDialog";

type HistoryRescueEntryProps = {
  customerId: string;
};

function issueLabel(issueType: string | null): string {
  return (
    RESCUE_ISSUE_OPTIONS.find((o) => o.value === issueType)?.label ??
    "Cứu hộ khẩn cấp"
  );
}

// /history/rescue: every rescue request the account filed, refreshed
// live over the customer realtime topic.
export function HistoryRescueEntry({ customerId }: HistoryRescueEntryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useMyRescues();
  useMyRescuesRealtime(Boolean(customerId));
  const items = query.data?.items ?? [];

  // Same deep-link contract as the booking tab: the payment banner sends
  // ?request=<id> and the rescue dialog (with the confirm code) opens on
  // its own. Closing it strips the param so it stays closed.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const deepRequest = searchParams.get("request");
  useEffect(() => {
    if (deepRequest) setSelectedId(deepRequest);
  }, [deepRequest]);

  const closeDialog = useCallback(() => {
    setSelectedId(null);
    if (deepRequest) router.replace(pathname, { scroll: false });
  }, [deepRequest, pathname, router]);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Lịch sử"
        title="Cứu hộ khẩn cấp."
        subtitle="Mọi yêu cầu cứu hộ bạn đã gửi. Trạng thái tự cập nhật khi điều phối giao thợ."
      />

      <section
        aria-label="Danh sách cứu hộ"
        className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Yêu cầu cứu hộ của bạn
          </h2>
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            aria-label="Tải lại danh sách cứu hộ"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiRefreshCw
              aria-hidden="true"
              className={`h-4 w-4 ${query.isFetching ? "motion-safe:animate-spin" : ""}`}
            />
          </button>
        </div>

        {query.isPending && (
          <p
            aria-busy="true"
            className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
          >
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
            Đang tải lịch sử cứu hộ…
          </p>
        )}

        {query.isError && (
          <div
            role="alert"
            className="mt-4 flex flex-col items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <p className="flex items-center gap-2">
              <FiAlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
              Không tải được lịch sử cứu hộ.
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="min-h-[44px] rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold transition-colors duration-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {query.isSuccess && items.length === 0 && (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <FiLifeBuoy
              aria-hidden="true"
              className="h-8 w-8 text-zinc-300 dark:text-zinc-700"
            />
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Bạn chưa gửi yêu cầu cứu hộ nào
            </p>
            <Link
              href="/rescue"
              className="mt-4 flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Gọi cứu hộ ngay
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <ul className="mt-3 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {items.map((rescue) => (
              <li key={rescue.requestId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(rescue.requestId)}
                  className="flex w-full min-w-0 flex-col gap-1 px-3 py-3 text-left transition-colors duration-200 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-900"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {issueLabel(rescue.issueType)}
                    </span>
                    <span className={rescueStatusBadgeClass(rescue.status)}>
                      {rescueStatusLabel(rescue.status)}
                    </span>
                    {rescue.priority === "high" && (
                      <span className="rounded-full border border-zinc-400 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
                        Ưu tiên
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(rescue.updatedAt)} ·{" "}
                    {rescue.vehiclePlate ?? "—"} ·{" "}
                    {rescue.assignedMechanicName
                      ? `Thợ: ${rescue.assignedMechanicName}`
                      : (rescue.address ?? "Chưa rõ vị trí")}
                    {rescue.status === "en_route" && rescue.etaMin !== null
                      ? ` · ~${rescue.etaMin} phút nữa tới nơi`
                      : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedId && (
        <HistoryRescueDialog requestId={selectedId} onClose={closeDialog} />
      )}
    </div>
  );
}
