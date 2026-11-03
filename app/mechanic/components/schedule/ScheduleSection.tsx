"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { ListSearchField } from "@/components/ui/ListSearchField";
import { useMechanicBookings } from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useCanonicalizePage, useRoutePage } from "@/hooks/useRoutePage";
import { matchesSearch } from "@/lib/search-text";
import type { MechanicBookingSummary } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { FilterTabs } from "../FilterTabs";
import {
  clampMechanicPage,
  MECHANIC_PAGE_SIZE,
  pageCountOf,
  pageRangeLabel,
  paginateMechanicItems,
} from "../mechanic-format";
import { BookingDetailDialog } from "./BookingDetailDialog";
import { ScheduleBody } from "./ScheduleBody";
import { SchedulePager } from "./SchedulePager";
import { ScheduleStatCards } from "./ScheduleStatCards";
import { ScheduleWeekChart } from "./ScheduleWeekChart";
import { SCHEDULE_TABS, type ScheduleTab } from "./schedule-tabs";

// Bento root for the schedule: live counts, a filterable work queue with
// paging, and a detail dialog for accepting, routing and closing jobs.
// Active tab comes from the route (one URL per tab) so links stay
// shareable and the browser back button works.
export function ScheduleSection({ status }: { status: ScheduleTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const toast = useToast();
  // The pager lives on the URL (/page/N); a tab switch changes the
  // [status] segment and drops the page segment by itself.
  const { page, hrefFor, firstPageHref } = useRoutePage();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const query = useMechanicBookings({ status });
  // Unfiltered load for the per-tab counts. Shares the cache key with the
  // shell queue, so no extra request is issued once it is warm.
  const totalsQuery = useMechanicBookings();

  const bookings = useMemo<MechanicBookingSummary[]>(
    () => query.data?.bookings ?? [],
    [query.data],
  );
  // The schedule is one bounded load (not cursor-paged), so search filters
  // the rows already in hand before paging.
  const matching = useMemo(() => {
    const needle = search.trim();
    if (!needle) return bookings;
    return bookings.filter((booking) =>
      matchesSearch(needle, [
        booking.id,
        booking.customerName,
        booking.vehiclePlate,
        booking.addressText,
        booking.serviceNames.join(" "),
      ]),
    );
  }, [bookings, search]);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (page > 1) router.replace(firstPageHref, { scroll: false });
  };
  const pageCount = pageCountOf(matching.length, MECHANIC_PAGE_SIZE);
  // The URL segment is 1-based; the slicing helpers take a 0-based index.
  const safePage = clampMechanicPage(page - 1, matching.length);
  useCanonicalizePage(pageCount, query.isSuccess);
  const visible = useMemo(
    () => paginateMechanicItems(matching, safePage),
    [matching, safePage],
  );
  const range = pageRangeLabel(safePage, matching.length);
  const filterLabel =
    SCHEDULE_TABS.find((item) => item.id === status)?.label ?? "Tất cả";
  const counts = useMemo<Record<string, number> | undefined>(() => {
    if (totalsQuery.isPending || !totalsQuery.data) return undefined;
    const tally: Record<string, number> = { all: 0 };
    for (const tab of SCHEDULE_TABS) tally[tab.id] = 0;
    for (const booking of totalsQuery.data.bookings) {
      tally.all += 1;
      tally[booking.status] = (tally[booking.status] ?? 0) + 1;
    }
    return tally;
  }, [totalsQuery.data, totalsQuery.isPending]);

  return (
    <div ref={rootRef} className="flex flex-col gap-3 md:gap-4">
      <ScheduleWeekChart />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <ScheduleStatCards bookings={bookings} loading={query.isPending} />
        <BentoCard
          label="Hàng đợi công việc"
          tour="mech-schedule-queue"
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Hàng đợi công việc
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {bookings.length} đơn được phân công cho bạn
              </p>
            </div>
            <FilterTabs
              tabs={SCHEDULE_TABS}
              activeId={status}
              ariaLabel="Lọc đơn theo trạng thái"
              counts={counts}
              tour="mech-schedule-tabs"
            />
          </div>
          <div className="mt-4">
            <ListSearchField
              id="schedule-search"
              value={search}
              onChange={handleSearch}
              placeholder="Khách, biển số, địa chỉ, dịch vụ…"
            />
          </div>
          <ScheduleBody
            isPending={query.isPending}
            isError={query.isError}
            filterLabel={filterLabel}
            visible={visible}
            onRetry={() => void query.refetch()}
            onOpen={setSelectedId}
          />
          {matching.length > MECHANIC_PAGE_SIZE && (
            <SchedulePager
              page={safePage}
              pageCount={pageCount}
              range={range}
              total={matching.length}
              hrefFor={(index) => hrefFor(index + 1)}
            />
          )}
        </BentoCard>
      </div>
      {selectedId && (
        <BookingDetailDialog
          bookingId={selectedId}
          onClose={() => setSelectedId(null)}
          onToast={(variant, title, description) =>
            variant === "success"
              ? toast.success(title, description)
              : toast.error(title, description)
          }
        />
      )}
    </div>
  );
}
