"use client";

import Link from "next/link";
import { FiFileText, FiMapPin } from "react-icons/fi";
import type {
  GuestRecordSummary,
  GuestRecordType,
} from "@/lib/guest-access/guest-access.types";
import {
  formatVnd,
  recordStatusLabel,
  recordSubtitle,
} from "./guest-access-format";

type GuestRecordListProps = {
  records: GuestRecordSummary[];
  maskedEmail: string;
  selected: { type: GuestRecordType; id: string } | null;
  onSelect: (record: GuestRecordSummary) => void;
  onReset: () => void;
};

const TYPE_ICONS = {
  booking: FiMapPin,
  rescue: FiMapPin,
  order: FiFileText,
} as const;

// After the OTP gate the visitor sees everything they filed without an
// account. Each row offers two distinct escapes: the invoice (read-only,
// gated) and, when the record type has a public tracking page, the live map
// that already works from the booking id alone.
export function GuestRecordList({
  records,
  maskedEmail,
  selected,
  onSelect,
  onReset,
}: GuestRecordListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Dịch vụ của {maskedEmail}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {records.length} bản ghi. Chọn một mục để xem hóa đơn.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 underline-offset-4 transition-colors duration-200 hover:text-zinc-900 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          Tra cứu email khác
        </button>
      </div>

      {records.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Chưa thấy dịch vụ nào với email này. Hãy kiểm tra lại địa chỉ đã dùng
          khi đặt lịch, hoặc liên hệ hotline để được hỗ trợ.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {records.map((record) => {
            const Icon = TYPE_ICONS[record.type];
            const isSelected =
              selected?.type === record.type && selected.id === record.id;
            return (
              <li
                key={`${record.type}-${record.id}`}
                className="flex items-stretch"
              >
                <button
                  type="button"
                  onClick={() => onSelect(record)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex min-h-[56px] flex-1 items-center gap-3 px-1 py-3 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-900"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-zinc-400"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {record.title}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {recordStatusLabel(record.status)}
                      {recordSubtitle(record)
                        ? ` · ${recordSubtitle(record)}`
                        : ""}
                    </span>
                  </span>
                  {record.total !== null && (
                    <span className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatVnd(record.total)}
                    </span>
                  )}
                </button>
                {record.trackHref && (
                  <Link
                    href={record.trackHref}
                    scroll={false}
                    prefetch={false}
                    aria-label={`Theo dõi trên bản đồ: ${record.title}`}
                    className="flex w-12 items-center justify-center border-l border-zinc-200 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                  >
                    <FiMapPin aria-hidden="true" className="h-4 w-4" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Quyền xem chỉ dành cho email đã xác minh, có hiệu lực 7 ngày. Bạn không
        cần tạo tài khoản.
      </p>
    </div>
  );
}
