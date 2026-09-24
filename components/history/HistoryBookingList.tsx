"use client";

import Link from "next/link";
import { FiAlertCircle, FiLoader, FiSearch } from "react-icons/fi";
import type { BookingSummary } from "@/lib/booking/workspace.types";
import { BookingCard } from "./BookingCard";
import { splitBookings } from "./history.utils";

type HistoryBookingListProps = {
  bookings: BookingSummary[];
  selectedId: string | null;
  search: string;
  pageNumber: number;
  loading: boolean;
  error: boolean;
  loadingNext: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onSearch: (value: string) => void;
  onSelect: (bookingId: string) => void;
  onOpen: (bookingId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onRetry: () => void;
};

function BookingSection({
  title,
  bookings,
  selectedId,
  onSelect,
  onOpen,
}: {
  title: string;
  bookings: BookingSummary[];
  selectedId: string | null;
  onSelect: (bookingId: string) => void;
  onOpen: (bookingId: string) => void;
}) {
  if (bookings.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {title}
      </h3>
      <ul className="flex flex-col gap-3">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            selected={booking.id === selectedId}
            onSelect={() => onSelect(booking.id)}
            onOpen={() => onOpen(booking.id)}
          />
        ))}
      </ul>
    </section>
  );
}

export function HistoryBookingList({
  bookings,
  selectedId,
  search,
  pageNumber,
  loading,
  error,
  loadingNext,
  hasPrevious,
  hasNext,
  onSearch,
  onSelect,
  onOpen,
  onPrevious,
  onNext,
  onRetry,
}: HistoryBookingListProps) {
  const buckets = splitBookings(bookings);

  return (
    <section
      aria-label="Danh sách lịch sử đặt lịch"
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
          placeholder="Tìm theo mã đơn, dịch vụ, thợ hoặc biển số…"
          aria-label="Tìm trong lịch sử đặt lịch"
          className="min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
      </div>

      {loading && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <p className="sr-only">Đang tải lịch sử đơn hàng</p>
          <div className="h-28 motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="h-28 motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="flex items-center gap-2 font-semibold">
            <FiAlertCircle aria-hidden="true" className="h-4 w-4" />
            Không tải được lịch sử đơn hàng.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold motion-safe:transition-colors motion-safe:duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-800 dark:hover:bg-red-950"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <p>
            {search
              ? "Không tìm thấy đơn phù hợp. Hãy thử mã đơn, dịch vụ, thợ hoặc biển số khác."
              : "Bạn chưa có đơn hàng nào."}
          </p>
          {!search && (
            <Link
              href="/services"
              className="flex min-h-[44px] items-center rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
            >
              Xem dịch vụ
            </Link>
          )}
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <>
          <div className="flex flex-col gap-5">
            <BookingSection
              title="Đang xử lý"
              bookings={buckets.active}
              selectedId={selectedId}
              onSelect={onSelect}
              onOpen={onOpen}
            />
            <BookingSection
              title="Lịch sử giao dịch"
              bookings={buckets.past}
              selectedId={selectedId}
              onSelect={onSelect}
              onOpen={onOpen}
            />
          </div>
          <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <p
              aria-live="polite"
              className="text-xs text-zinc-500 dark:text-zinc-400"
            >
              Trang {pageNumber} · {bookings.length} đơn
            </p>
            {(hasPrevious || hasNext) && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onPrevious}
                  disabled={!hasPrevious || loadingNext}
                  aria-label="Trang trước"
                  className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-800 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!hasNext || loadingNext}
                  aria-label="Trang sau"
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-800 motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  {loadingNext && (
                    <FiLoader
                      aria-hidden="true"
                      className="h-4 w-4 motion-safe:animate-spin"
                    />
                  )}
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
