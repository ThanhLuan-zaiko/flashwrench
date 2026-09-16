"use client";

import { FiAlertCircle, FiLoader } from "react-icons/fi";
import type { MechanicNavigationTarget } from "@/services/mechanic.api";
import {
  formatDistanceKm,
  formatEtaMin,
  formatScheduleDateTime,
  STATUS_LABELS,
  statusTone,
} from "../mechanic-format";

type NavigationListProps = {
  loading: boolean;
  isError: boolean;
  targets: MechanicNavigationTarget[];
  selectedId: string | null;
  onSelect: (bookingId: string) => void;
  onRetry: () => void;
};

// Open-job list sorted by distance. Single-select buttons only.
export function NavigationList({
  loading,
  isError,
  targets,
  selectedId,
  onSelect,
  onRetry,
}: NavigationListProps) {
  if (loading) {
    return (
      <div
        className="mt-3 flex items-center justify-center py-10"
        aria-live="polite"
        aria-busy="true"
      >
        <FiLoader
          aria-hidden="true"
          className="h-7 w-7 text-zinc-400 motion-safe:animate-spin dark:text-zinc-500"
        />
        <span className="sr-only">Đang tải danh sách điểm đến</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mt-3 flex flex-col items-center py-10 text-center">
        <FiAlertCircle aria-hidden="true" className="h-9 w-9 text-zinc-400" />
        <p className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Không tải được bản đồ
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Tải lại
        </button>
      </div>
    );
  }
  if (targets.length === 0) {
    return (
      <p className="mt-3 rounded-2xl border border-zinc-200 px-3 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Không có đơn nào cần di chuyển. Đơn mới có địa chỉ sẽ hiện ở đây.
      </p>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {targets.map((target) => {
        const selected = target.bookingId === selectedId;
        return (
          <li key={target.bookingId}>
            <button
              type="button"
              onClick={() => onSelect(target.bookingId)}
              aria-current={selected ? "true" : undefined}
              className={`flex min-h-[44px] w-full flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {target.customerName || "Khách hàng"}
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone(target.status)}`}
                >
                  {STATUS_LABELS[target.status]}
                </span>
              </span>
              <span
                className={`truncate text-xs ${
                  selected
                    ? "text-zinc-300 dark:text-zinc-600"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {target.addressText}
              </span>
              <span
                className={`flex items-center gap-2 text-xs font-medium ${
                  selected
                    ? "text-zinc-200 dark:text-zinc-700"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                <span>{formatDistanceKm(target.distanceKm)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatEtaMin(target.etaMin)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatScheduleDateTime(target.scheduledAt)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
