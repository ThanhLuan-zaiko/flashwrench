"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { useMechanicBookings } from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
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
import {
  SCHEDULE_TABS,
  type ScheduleTab,
  shouldResetSchedulePager,
} from "./schedule-tabs";

// Bento root for the schedule: live counts, a filterable work queue with
// paging, and a detail dialog for accepting, routing and closing jobs.
// Active tab comes from the route (one URL per tab) so links stay
// shareable and the browser back button works.
export function ScheduleSection({ status }: { status: ScheduleTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [appliedStatus, setAppliedStatus] = useState(status);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (shouldResetSchedulePager(appliedStatus, status)) {
    setAppliedStatus(status);
    setPage(0);
  }

  const query = useMechanicBookings({ status });
  // Unfiltered load for the per-tab counts. Shares the cache key with the
  // shell queue, so no extra request is issued once it is warm.
  const totalsQuery = useMechanicBookings();

  const bookings = useMemo<MechanicBookingSummary[]>(
    () => query.data?.bookings ?? [],
    [query.data],
  );
  const pageCount = pageCountOf(bookings.length, MECHANIC_PAGE_SIZE);
  const safePage = clampMechanicPage(page, bookings.length);
  const visible = useMemo(
    () => paginateMechanicItems(bookings, safePage),
    [bookings, safePage],
  );
  const range = pageRangeLabel(safePage, bookings.length);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <ScheduleStatCards bookings={bookings} loading={query.isPending} />
        <BentoCard
          label="Hàng đợi công việc"
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
          {bookings.length > MECHANIC_PAGE_SIZE && (
            <SchedulePager
              page={safePage}
              pageCount={pageCount}
              range={range}
              total={bookings.length}
              onPage={setPage}
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
