"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiRefreshCw, FiUser } from "react-icons/fi";
import { Stars } from "@/components/feedback/Stars";
import { useAvailableMechanics } from "@/hooks/booking";
import type { MechanicDirectoryItem } from "@/lib/mechanic/mechanic-directory.service";
import { MechanicReviewsPanel } from "./MechanicReviewsPanel";
import { rankTopMechanics } from "./mechanic-ranking";

function TopMechanicRow({ item }: { item: MechanicDirectoryItem }) {
  const [open, setOpen] = useState(false);
  const rated = item.ratingCount > 0;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <FiUser aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.displayName}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Stars
              rating={item.ratingAvg}
              size="h-3 w-3"
              label={
                rated
                  ? `${item.ratingAvg.toFixed(1)} trên 5 sao`
                  : "Chưa có đánh giá"
              }
            />
            <span>
              {rated
                ? `${item.ratingAvg.toFixed(1)} · ${item.ratingCount} đánh giá`
                : "Chưa có đánh giá"}
            </span>
            <span>{item.completedJobs} đơn đã làm</span>
          </p>
          {item.skills.length > 0 && (
            <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              {item.skills.join(" · ")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={`Xem đánh giá của thợ ${item.displayName}`}
          className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border border-zinc-300 px-2.5 text-[11px] font-semibold text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Đánh giá
          <FiChevronDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      {open && <MechanicReviewsPanel mechanicId={item.id} />}
    </li>
  );
}

// Always-visible block on the booking page: the best rated mechanics who
// are online right now, so customers see who is behind the service even
// when they leave dispatch to the system.
export function TopMechanicsCard({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const mechanics = useAvailableMechanics(
    lat !== null && lng !== null ? { lat, lng } : {},
  );
  const top = useMemo(
    () => rankTopMechanics(mechanics.data?.mechanics ?? []),
    [mechanics.data],
  );

  return (
    <section
      aria-label="Thợ được đánh giá cao"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Thợ được đánh giá cao
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Các thợ đang trực tuyến, xếp theo điểm đánh giá của khách hàng.
        </p>
      </div>

      {mechanics.isPending && (
        <div aria-busy="true" className="flex flex-col gap-2">
          <p className="sr-only">Đang tải danh sách thợ</p>
          {[0, 1].map((skeleton) => (
            <div
              key={skeleton}
              className="h-16 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}

      {mechanics.isError && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <p className="font-semibold">Không tải được danh sách thợ.</p>
          <button
            type="button"
            onClick={() => void mechanics.refetch()}
            className="mt-2 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-3 py-1.5 font-semibold transition-colors duration-200 hover:bg-red-100 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Thử tải lại
          </button>
        </div>
      )}

      {mechanics.isSuccess && top.length > 0 && (
        <ul className="flex flex-col gap-2">
          {top.map((item) => (
            <TopMechanicRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {mechanics.isSuccess && top.length === 0 && (
        <p className="rounded-xl border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Hiện chưa có thợ trực tuyến. Đơn của bạn sẽ được điều phối ngay khi có
          thợ rảnh.
        </p>
      )}
    </section>
  );
}
