"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiAlertCircle, FiLoader, FiRefreshCw } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { bookingKeys, useMyBookings } from "@/hooks/booking";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { userTopic } from "@/lib/realtime/protocol";
import { BookingCard } from "./BookingCard";
import { BookingDetailDialog } from "./BookingDetailDialog";
import { splitBookings } from "./history.utils";

type HistoryEntryProps = {
  customerId: string;
};

// Customer booking history: in-flight orders on top (with live tracking
// inside the detail dialog), finished ones behind. Server-sent events on
// the customer's own topic refresh the list on every transition and
// mechanic location pin.
export function HistoryEntry({ customerId }: HistoryEntryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useMyBookings();

  useDomainRealtime(
    userTopic(customerId),
    [bookingKeys.mine, ["bookings", "detail"]],
    Boolean(customerId),
  );

  const buckets = useMemo(() => {
    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    return splitBookings(items);
  }, [query.data]);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Lịch sử"
        title="Đơn hàng của bạn."
        subtitle="Theo dõi thợ đang trên đường, xem lại tiến trình và giao dịch của các đơn đã đặt."
      />

      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <p className="sr-only">Đang tải lịch sử đơn hàng</p>
          {["skeleton-a", "skeleton-b", "skeleton-c"].map((key) => (
            <div
              key={key}
              className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}

      {query.isError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="flex items-center gap-2 font-semibold">
            <FiAlertCircle aria-hidden="true" className="h-4 w-4" />
            Không tải được lịch sử đơn hàng.
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử tải lại
          </button>
        </div>
      )}

      {query.isSuccess && buckets.active.length + buckets.past.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Bạn chưa có đơn hàng nào
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Đặt dịch vụ đầu tiên để theo dõi thợ và giao dịch tại đây.
          </p>
          <Link
            href="/services"
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
          >
            Xem dịch vụ
          </Link>
        </div>
      )}

      {buckets.active.length > 0 && (
        <section aria-label="Đơn đang xử lý" className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Đang xử lý
          </h2>
          <ul className="flex flex-col gap-3">
            {buckets.active.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onOpen={() => setSelectedId(booking.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {buckets.past.length > 0 && (
        <section aria-label="Đơn đã kết thúc" className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Lịch sử giao dịch
          </h2>
          <ul className="flex flex-col gap-3">
            {buckets.past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onOpen={() => setSelectedId(booking.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="mx-auto flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {query.isFetchingNextPage && (
            <FiLoader aria-hidden="true" className="h-4 w-4 animate-spin" />
          )}
          Tải thêm đơn cũ hơn
        </button>
      )}

      {selectedId && (
        <BookingDetailDialog
          bookingId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
