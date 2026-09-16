"use client";

import { useMemo, useState } from "react";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useToast } from "@/components/toast/useToast";
import { useMechanicBookings } from "@/hooks/mechanic";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import type { MechanicBookingSummary } from "@/services/mechanic.api";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
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

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ nhận đơn" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "mechanic_assigned", label: "Đã nhận đơn" },
  { value: "en_route", label: "Đang di chuyển" },
  { value: "in_progress", label: "Đang sửa xe" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

// Bento root for the schedule: live counts, a filterable work queue with
// paging, and a detail dialog for accepting, routing and closing jobs.
export function ScheduleSection() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useMechanicBookings({
    status: filter === "all" ? "all" : (filter as never),
  });

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
    STATUS_FILTERS.find((item) => item.value === filter)?.label ?? "Tất cả";

  const pickFilter = (value: string) => {
    setFilter(value);
    setPage(0);
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Lịch làm việc thợ xe"
        title="Đơn nào trước, rõ từng việc."
        subtitle="Nhận đơn mới, di chuyển tới điểm sửa và chốt đơn ngay trên điện thoại."
      />
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
            <div
              role="tablist"
              aria-label="Lọc đơn theo trạng thái"
              className="flex flex-wrap gap-1.5"
            >
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.value}
                  onClick={() => pickFilter(item.value)}
                  className={`min-h-[44px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors duration-200 ${
                    filter === item.value
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
