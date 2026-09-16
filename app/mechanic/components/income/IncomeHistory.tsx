import { FiAlertCircle, FiLoader } from "react-icons/fi";
import type { MechanicIncomeEntry } from "@/services/mechanic.api";
import {
  formatShortDate,
  formatVnd,
  incomeStateLabel,
} from "../mechanic-format";

type IncomeHistoryProps = {
  isPending: boolean;
  isError: boolean;
  visible: MechanicIncomeEntry[];
  page: number;
  pageCount: number;
  range: { start: number; end: number };
  total: number;
  truncated: boolean;
  onPage: (page: number) => void;
  onRetry: () => void;
};

// Transaction list with skeleton, retry, empty hint, numbered pager and a
// scan-limit footnote when older bookings were left out of the summary.
export function IncomeHistory({
  isPending,
  isError,
  visible,
  page,
  pageCount,
  range,
  total,
  truncated,
  onPage,
  onRetry,
}: IncomeHistoryProps) {
  if (isPending) {
    return (
      <div
        className="mt-4 flex items-center justify-center py-12"
        aria-live="polite"
        aria-busy="true"
      >
        <FiLoader
          aria-hidden="true"
          className="h-8 w-8 text-zinc-400 motion-safe:animate-spin dark:text-zinc-500"
        />
        <span className="sr-only">Đang tải lịch sử giao dịch</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mt-4 flex flex-col items-center py-12 text-center">
        <FiAlertCircle aria-hidden="true" className="h-10 w-10 text-zinc-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Không tải được thu nhập
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Tải lại
        </button>
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center py-12 text-center">
        <FiAlertCircle aria-hidden="true" className="h-10 w-10 text-zinc-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Chưa có giao dịch nào
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Giao dịch xuất hiện khi đơn hoàn thành và được thanh toán.
        </p>
      </div>
    );
  }
  return (
    <>
      <ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {visible.map((entry) => (
          <li
            key={entry.bookingId}
            className="flex flex-col gap-2 px-3 py-3 transition-colors duration-200 hover:bg-zinc-50 sm:flex-row sm:items-center dark:hover:bg-zinc-900"
          >
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {entry.customerName || "Khách hàng"} · {entry.vehiclePlate}
                </span>
                <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                  {incomeStateLabel(entry.state)}
                </span>
              </span>
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                {entry.method ? `${entry.method} · ` : ""}
                {formatShortDate(entry.stamp)}
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {formatVnd(entry.total)}
            </span>
          </li>
        ))}
      </ul>
      {total > visible.length && (
        <nav
          aria-label="Phân trang giao dịch"
          className="flex flex-wrap items-center justify-between gap-2 pt-3"
        >
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hiển thị {range.start}–{range.end} trên {total} giao dịch
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: pageCount }, (_, index) => index).map(
              (index) => (
                <button
                  key={index}
                  type="button"
                  disabled={index === page}
                  onClick={() => onPage(index)}
                  aria-label={`Trang ${index + 1}`}
                  aria-current={index === page ? "page" : undefined}
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.98] ${
                    index === page
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {index + 1}
                </button>
              ),
            )}
          </div>
        </nav>
      )}
      {truncated && (
        <p className="pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Chỉ hiển thị các giao dịch gần nhất; đơn cũ hơn vẫn được tính trong
          tổng đã thu.
        </p>
      )}
    </>
  );
}
