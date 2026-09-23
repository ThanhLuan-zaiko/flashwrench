"use client";

import { FiSearch } from "react-icons/fi";
import type { BookingSummary } from "@/services/dispatch.api";
import { FilterTabs } from "../../../mechanic/components/FilterTabs";
import { DispatchPager } from "./DispatchPager";
import { DispatchQueue } from "./DispatchQueue";
import { formatMonthKey, isMonthKey } from "./dispatch-format";
import { DISPATCH_STATUS_LABELS, DISPATCH_TABS, type DispatchTab } from "./dispatch-tabs";
import { DispatchTrackingPanel } from "./DispatchTrackingPanel";

type DispatchTrackingBoardViewProps = {
  status: DispatchTab;
  month: string;
  search: string;
  bookings: BookingSummary[];
  selectedId: string | null;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  page: number;
  canBack: boolean;
  canNext: boolean;
  onMonthChange: (month: string) => void;
  onSearch: (value: string) => void;
  onSelect: (bookingId: string) => void;
  onOpen: (bookingId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function DispatchTrackingBoardView({
  status,
  month,
  search,
  bookings,
  selectedId,
  isPending,
  isError,
  isFetching,
  page,
  canBack,
  canNext,
  onMonthChange,
  onSearch,
  onSelect,
  onOpen,
  onRetry,
  onBack,
  onNext,
}: DispatchTrackingBoardViewProps) {
  const selected = bookings.find((booking) => booking.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <header className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between md:p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Bàn điều phối đơn hàng
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {DISPATCH_STATUS_LABELS[status]} · {formatMonthKey(month)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Tháng đặt lịch
            <input
              type="month"
              value={month}
              onChange={(event) => {
                if (isMonthKey(event.target.value)) onMonthChange(event.target.value);
              }}
              className="mt-1 min-h-[44px] rounded-xl border border-zinc-300 bg-white px-3 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
          <FilterTabs
            tabs={DISPATCH_TABS}
            activeId={status}
            ariaLabel="Lọc đơn theo trạng thái"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 md:gap-5 lg:grid-cols-2">
        <DispatchTrackingPanel booking={selected} />
        <section
          aria-label="Danh sách đơn điều phối"
          className="flex min-w-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="relative">
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={search}
              maxLength={80}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Tìm mã đơn, khách, dịch vụ, thợ, biển số hoặc địa chỉ…"
              aria-label="Tìm trong danh sách đơn điều phối"
              className="min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {bookings.length} đơn trong trang này
          </p>
          <DispatchQueue
            isPending={isPending}
            isError={isError}
            filterLabel={DISPATCH_STATUS_LABELS[status]}
            items={bookings}
            selectedId={selectedId}
            onSelect={onSelect}
            onRetry={onRetry}
            onOpen={onOpen}
          />
          <DispatchPager
            page={page}
            count={bookings.length}
            canBack={canBack}
            canNext={canNext}
            loading={isFetching}
            onBack={onBack}
            onNext={onNext}
          />
        </section>
      </div>
    </div>
  );
}
