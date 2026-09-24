"use client";

import { useEffect, useRef, useState } from "react";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { bookingKeys, useMyBookings } from "@/hooks/booking";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { userTopic } from "@/lib/realtime/protocol";
import { BookingDetailDialog } from "./BookingDetailDialog";
import { HistoryBookingList } from "./HistoryBookingList";
import { HistoryRoutePanel } from "./HistoryRoutePanel";

type HistoryEntryProps = {
  customerId: string;
};

export function HistoryEntry({ customerId }: HistoryEntryProps) {
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const querySearchRef = useRef(querySearch);
  querySearchRef.current = querySearch;
  const query = useMyBookings(querySearch);
  const pages = query.data?.pages ?? [];
  const page = pages[pageIndex];
  const bookings = page?.items ?? [];
  const selectedBooking =
    pages
      .flatMap((result) => result.items)
      .find((booking) => booking.id === selectedId) ?? null;

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuerySearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (pages.length > 0 && pageIndex >= pages.length) {
      setPageIndex(pages.length - 1);
    }
  }, [pageIndex, pages.length]);

  useDomainRealtime(
    userTopic(customerId),
    [
      bookingKeys.mine,
      ["bookings", "detail"],
      bookingKeys.travelTrack(selectedId ?? ""),
    ],
    Boolean(customerId),
  );

  function handleSearch(value: string) {
    setSearch(value);
    setPageIndex(0);
    setSelectedId(null);
    setDetailId(null);
  }

  async function nextPage() {
    if (pageIndex < pages.length - 1) {
      setPageIndex((current) => current + 1);
      return;
    }
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    const expectedSearch = querySearch;
    const nextIndex = pageIndex + 1;
    const result = await query.fetchNextPage();
    if (
      !result.isError &&
      querySearchRef.current === expectedSearch &&
      result.data?.pages[nextIndex]
    ) {
      setPageIndex(nextIndex);
    }
  }

  const hasNext = pageIndex < pages.length - 1 || Boolean(query.hasNextPage);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Lịch sử"
        title="Đơn hàng của bạn."
        subtitle="Chọn một đơn để xem lộ trình thợ; tìm kiếm và chuyển trang ngay trong danh sách."
      />

      <div className="grid grid-cols-1 items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <HistoryRoutePanel booking={selectedBooking} />
        <HistoryBookingList
          bookings={bookings}
          selectedId={selectedId}
          search={search}
          pageNumber={pageIndex + 1}
          loading={query.isPending}
          error={query.isError}
          loadingNext={query.isFetchingNextPage}
          hasPrevious={pageIndex > 0}
          hasNext={hasNext}
          onSearch={handleSearch}
          onSelect={setSelectedId}
          onOpen={setDetailId}
          onPrevious={() => setPageIndex((current) => Math.max(0, current - 1))}
          onNext={() => void nextPage()}
          onRetry={() => void query.refetch()}
        />
      </div>

      {detailId && (
        <BookingDetailDialog
          bookingId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
