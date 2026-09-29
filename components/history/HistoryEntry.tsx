"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { PageBounce } from "@/components/pagination/PageBounce";
import { bookingKeys, useMyBookings } from "@/hooks/booking";
import { useDomainRealtime } from "@/hooks/useDomainRealtime";
import { useRoutePage } from "@/hooks/useRoutePage";
import { userTopic } from "@/lib/realtime/protocol";
import { BookingDetailDialog } from "./BookingDetailDialog";
import { HistoryBookingList } from "./HistoryBookingList";
import { HistoryRoutePanel } from "./HistoryRoutePanel";

type HistoryEntryProps = {
  customerId: string;
};

// Booking history pager over an infinite query: the URL owns the page
// index (/history/page/N), the query cache owns the fetched page chain.
// Page N+1 resolves by walking fetchNextPage once — anything deeper cold
// bounces to the list root.
export function HistoryEntry({ customerId }: HistoryEntryProps) {
  const router = useRouter();
  const { page, firstPageHref, hrefFor } = useRoutePage();
  const index = page - 1;
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const query = useMyBookings(querySearch);
  const pages = query.data?.pages ?? [];
  const result = index < pages.length ? pages[index] : undefined;
  const bookings = result?.items ?? [];
  const selectedBooking =
    pages
      .flatMap((page) => page.items)
      .find((booking) => booking.id === selectedId) ?? null;

  // A page is resolvable when it is already fetched or sits exactly one
  // fetchNextPage ahead — deeper cold links cannot be walked.
  const resolvable =
    index < pages.length ||
    (index === pages.length && Boolean(query.hasNextPage));

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuerySearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  // A new applied search drops the /page/N segment and the selection —
  // the cached chain belongs to the previous filter.
  const lastSearchRef = useRef(querySearch);
  useEffect(() => {
    if (lastSearchRef.current === querySearch) return;
    lastSearchRef.current = querySearch;
    setSelectedId(null);
    setDetailId(null);
    if (page > 1) router.replace(firstPageHref, { scroll: false });
  }, [querySearch, page, firstPageHref, router]);

  // Resolve the URL page: one step past the fetched chain walks
  // fetchNextPage; past the real end lands on the last known page; deeper
  // cold links bounce to the root.
  useEffect(() => {
    if (!query.isSuccess) return;
    if (index === pages.length) {
      if (query.hasNextPage) {
        if (!query.isFetchingNextPage) void query.fetchNextPage();
      } else {
        router.replace(hrefFor(Math.max(1, pages.length)), {
          scroll: false,
        });
      }
      return;
    }
    if (index > pages.length) {
      router.replace(firstPageHref, { scroll: false });
    }
  }, [
    query.isSuccess,
    query.hasNextPage,
    query.isFetchingNextPage,
    query.fetchNextPage,
    index,
    pages.length,
    hrefFor,
    firstPageHref,
    router,
  ]);

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
  }

  if (query.isSuccess && !resolvable) {
    return <PageBounce />;
  }

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
          pageNumber={page}
          loading={
            query.isPending ||
            (index >= pages.length && query.isFetchingNextPage)
          }
          error={query.isError}
          loadingNext={query.isFetchingNextPage}
          hasPrevious={page > 1}
          hasNext={index < pages.length - 1 || Boolean(query.hasNextPage)}
          backHref={hrefFor(page - 1)}
          nextHref={hrefFor(page + 1)}
          onSearch={handleSearch}
          onSelect={setSelectedId}
          onOpen={setDetailId}
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
