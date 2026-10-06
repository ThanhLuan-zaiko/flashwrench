"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiInbox,
  FiLifeBuoy,
  FiPhone,
  FiRefreshCw,
} from "react-icons/fi";
import { PageBounce } from "@/components/pagination/PageBounce";
import { RESCUE_ISSUE_OPTIONS } from "@/components/rescue/rescue-constants";
import { useDispatchRescues, useRescueOperations } from "@/hooks/rescue-inbox";
import { useCursorRoutePage } from "@/hooks/useCursorRoutePage";
import { FilterTabs } from "../../../mechanic/components/FilterTabs";
import { RescueDetailDialog } from "./RescueDetailDialog";
import { RESCUE_BOARD_TABS, type RescueBoardTab } from "./rescue-tabs";

function issueLabel(issueType: string | null): string {
  return (
    RESCUE_ISSUE_OPTIONS.find((o) => o.value === issueType)?.label ??
    "Cứu hộ khẩn cấp"
  );
}

// Dispatcher rescue board: URL tabs per status with cursor Trước/Sau
// paging. Realtime operations events invalidate the board, so new
// rescues and 30s re-offers appear with no reload.
export function RescueBoard({ status }: { status: RescueBoardTab }) {
  // The page index lives on the URL (/page/N); the pageState chain lives
  // in an in-memory map keyed by that index. Cold loads on N>1 bounce to
  // the tab root because mid-chain cursors cannot be reconstructed.
  const { page, cursor, known, recordNext, reset, hrefFor } =
    useCursorRoutePage();
  const board = useDispatchRescues(status, cursor);
  const [appliedStatus, setAppliedStatus] = useState(status);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useRescueOperations();

  // Reset cursors on tab switch during render, never in an effect — the
  // new tab's URL already carries no page segment.
  if (status !== appliedStatus) {
    setAppliedStatus(status);
    setSelectedId(null);
    reset();
  }

  const items = board.data?.items ?? [];
  const nextCursor = board.data?.nextCursor ?? null;
  const hasPrev = page > 1;
  const hasNext = nextCursor !== null;

  if (!known) {
    return <PageBounce />;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <FilterTabs
        tabs={RESCUE_BOARD_TABS}
        activeId={status}
        ariaLabel="Trạng thái cứu hộ"
        tour="disp-rescue-tabs"
      />

      <div data-tour="disp-rescue-list">
        {board.isPending ? (
          <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            Đang tải cứu hộ…
          </p>
        ) : board.isError ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Không tải được cứu hộ
            </p>
            <button
              type="button"
              onClick={() => void board.refetch()}
              className="mx-auto mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <FiInbox
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700"
            />
            <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Không có cứu hộ chờ
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Yêu cầu mới do hệ thống tự giao thợ sẽ hiện ở đây ngay lập tức.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((rescue) => (
              <li
                key={rescue.requestId}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <FiLifeBuoy
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                    {issueLabel(rescue.issueType)}
                    {rescue.priority === "high" ? " · Ưu tiên" : ""}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {rescue.address ?? "Chưa rõ vị trí"} ·{" "}
                    {rescue.vehiclePlate ?? ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {rescue.customerName} · {rescue.customerPhone}
                    {rescue.assignedMechanicName
                      ? ` · Thợ: ${rescue.assignedMechanicName}`
                      : ""}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(rescue.requestId)}
                    aria-label={`Xem chi tiết cứu hộ của ${rescue.customerName ?? "khách"}`}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] sm:max-w-44 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <FiEye aria-hidden="true" className="h-4 w-4" />
                    Xem chi tiết
                  </button>
                  <a
                    href={`tel:${(rescue.customerPhone ?? "").replace(/\s/g, "")}`}
                    aria-label={`Gọi ${rescue.customerName ?? "khách"}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <FiPhone aria-hidden="true" className="h-4 w-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId && (
        <RescueDetailDialog
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {(hasPrev || hasNext) && (
        <nav
          aria-label="Phân trang cứu hộ"
          className="flex items-center justify-between gap-2"
        >
          {hasPrev && !board.isFetching ? (
            <Link
              href={hrefFor(page - 1)}
              scroll={false}
              aria-label="Trang trước"
              className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
              Trước
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Trang trước"
              className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
            >
              <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
              Trước
            </button>
          )}
          {hasNext && !board.isFetching ? (
            <Link
              href={hrefFor(page + 1)}
              scroll={false}
              onClick={() => {
                if (nextCursor) recordNext(nextCursor);
              }}
              aria-label="Trang sau"
              className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Sau
              <FiChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Trang sau"
              className="flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
            >
              {board.isFetching ? "Đang tải…" : "Sau"}
              <FiChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
