"use client";

import { FiInbox, FiLoader } from "react-icons/fi";
import type { ComplaintItem } from "@/lib/complaints/complaint.types";
import { CatalogPager } from "../services/CatalogPager";
import { SelectDropdown } from "../services/SelectDropdown";
import { usePagination } from "../services/usePagination";
import type { ComplaintDialogState } from "./ComplaintDialog";
import {
  COMPLAINT_REF_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUS_OPTIONS,
  formatViDate,
} from "./complaint-format";

type ComplaintListProps = {
  items: ComplaintItem[];
  isPending: boolean;
  isError: boolean;
  busyId: string | null;
  statusFilter: string;
  onFilterChange: (status: string) => void;
  onOpenDialog: (dialog: ComplaintDialogState) => void;
  onQuickReopen: (item: ComplaintItem) => void;
  onRetry: () => void;
};

function StatusPill({ item }: { item: ComplaintItem }) {
  return (
    <span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
      {COMPLAINT_STATUS_LABELS[item.status]}
    </span>
  );
}

// Complaint queue with status filter. Every row opens the handle
// dialog; closed records also offer one-tap reopen. Paged like the
// catalog price list so long queues stay scannable.
export function ComplaintList({
  items,
  isPending,
  isError,
  busyId,
  statusFilter,
  onFilterChange,
  onOpenDialog,
  onQuickReopen,
  onRetry,
}: ComplaintListProps) {
  const pager = usePagination(items.length);
  const handleFilterChange = (status: string) => {
    pager.reset();
    onFilterChange(status);
  };

  return (
    <div className="flex flex-col gap-3">
      <SelectDropdown
        label="Lọc theo trạng thái"
        value={statusFilter}
        options={COMPLAINT_STATUS_OPTIONS}
        onChange={handleFilterChange}
        allLabel="Tất cả trạng thái"
        listLabel="Chọn trạng thái"
        unitName="trạng thái"
        className="relative w-full sm:max-w-xs"
      />

      {isPending ? (
        <ul className="flex flex-col gap-2" aria-label="Đang tải khiếu nại">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-900"
            >
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Đang tải khiếu nại…
              </span>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div className="rounded-xl bg-zinc-100 px-4 py-10 text-center dark:bg-zinc-900">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Không tải được khiếu nại.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mx-auto mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-6 dark:bg-zinc-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <FiInbox aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Chưa có khiếu nại nào
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              Nhấn Ghi nhận khiếu nại để tạo mới
            </span>
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {pager.slice(items).map((item) => {
              const busy = busyId === item.id;
              const closed =
                item.status === "resolved" || item.status === "rejected";
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-3 py-3 transition-colors duration-200 hover:bg-zinc-50 sm:flex-row sm:items-center dark:hover:bg-zinc-900"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.subject}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.reporterName}
                      {item.reporterPhone ? ` · ${item.reporterPhone}` : ""} ·{" "}
                      {formatViDate(item.createdAt)}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <StatusPill item={item} />
                      <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        {COMPLAINT_REF_LABELS[item.refType] ?? "Khác"}
                        {item.targetName ? ` · ${item.targetName}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onOpenDialog({ mode: "handle", item })}
                      aria-label={`Xử lý khiếu nại ${item.subject}`}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {closed ? "Xem chi tiết" : "Xử lý"}
                    </button>
                    {closed && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onQuickReopen(item)}
                        aria-label={`Mở lại khiếu nại ${item.subject}`}
                        className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        Mở lại
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <CatalogPager
            page={pager.page}
            pageCount={pager.pageCount}
            start={pager.range.start}
            end={pager.range.end}
            total={items.length}
            onPage={pager.goTo}
          />
        </div>
      )}
    </div>
  );
}
