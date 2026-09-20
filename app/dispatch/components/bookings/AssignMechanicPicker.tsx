"use client";

import { FiRefreshCw, FiStar, FiUser, FiWifi } from "react-icons/fi";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useAvailableMechanics } from "@/hooks/booking";
import { formatDistanceKm } from "../../../mechanic/components/mechanic-format";

type AssignMechanicPickerProps = {
  lat: number | null;
  lng: number | null;
  value: string | null;
  excludeId?: string | null;
  disabled?: boolean;
  onChange: (mechanicId: string, displayName: string) => void;
};

// Online, verified mechanics sorted nearest-first to the booking address.
// The currently assigned mechanic stays visible but disabled so the
// dispatcher cannot "re-assign" the same person (the API rejects it).
export function AssignMechanicPicker({
  lat,
  lng,
  value,
  excludeId,
  disabled,
  onChange,
}: AssignMechanicPickerProps) {
  const origin = lat !== null && lng !== null ? { lat, lng } : {};
  const mechanics = useAvailableMechanics(origin);
  const items = mechanics.data?.mechanics ?? [];

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-2">
      <legend className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Chọn thợ trực tuyến
      </legend>

      {mechanics.isPending && (
        <div aria-busy="true" className="flex flex-col gap-2">
          <p className="sr-only">Đang tải danh sách thợ</p>
          {[0, 1].map((skeleton) => (
            <div
              key={skeleton}
              className="h-14 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
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

      {mechanics.isSuccess && items.length === 0 && (
        <p className="rounded-xl bg-zinc-100 px-3 py-2.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          Chưa có thợ nào đang trực tuyến. Thử lại sau hoặc giữ đơn ở trạng thái
          chờ.
        </p>
      )}

      {mechanics.isSuccess && items.length > 0 && (
        <ul
          className={`flex max-h-56 flex-col gap-2 overflow-y-auto pr-1 ${SCROLLBAR_CLASSES}`}
        >
          {items.map((item) => {
            const isCurrent = item.id === excludeId;
            const selected = value === item.id;
            return (
              <li key={item.id}>
                <label
                  className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200 ${
                    isCurrent
                      ? "cursor-not-allowed border-zinc-200 opacity-60 dark:border-zinc-800"
                      : selected
                        ? "cursor-pointer border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-900"
                        : "cursor-pointer border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispatch-mechanic"
                    checked={selected}
                    disabled={isCurrent}
                    onChange={() => onChange(item.id, item.displayName)}
                    aria-label={`Chọn thợ ${item.displayName}`}
                    className="h-4 w-4 shrink-0 accent-zinc-900 dark:accent-white"
                  />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <FiUser aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.displayName}
                      {isCurrent ? " (đang phụ trách)" : ""}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FiStar aria-hidden="true" className="h-3 w-3" />
                        {item.ratingAvg.toFixed(1)} · {item.completedJobs} đơn
                      </span>
                      {item.distanceKm !== null && (
                        <span>Cách {formatDistanceKm(item.distanceKm)}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <FiWifi aria-hidden="true" className="h-3 w-3" />
                        Trực tuyến
                      </span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
