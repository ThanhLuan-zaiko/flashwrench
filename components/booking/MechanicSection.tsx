"use client";

import { useEffect, useState } from "react";
import { FiChevronDown, FiRefreshCw } from "react-icons/fi";
import { useAvailableMechanics } from "@/hooks/booking";
import { MechanicPickerCard } from "./MechanicPickerCard";

type MechanicSectionProps = {
  lat: number | null;
  lng: number | null;
  value: string | null;
  error?: string;
  disabled?: boolean;
  onChange: (mechanicId: string | null) => void;
};

function cardClasses(active: boolean): string {
  return `flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200 ${
    active
      ? "border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-900"
      : "border-zinc-300 dark:border-zinc-700"
  }`;
}

// Mechanic step: auto-dispatch stays the default while "Chọn thợ mình
// thích" expands the verified online directory, nearest first.
export function MechanicSection({
  lat,
  lng,
  value,
  error,
  disabled,
  onChange,
}: MechanicSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(value !== null);

  // A prefilled mechanic arrives with the section already mounted, so
  // the picker opens on its own whenever a saved pick lands.
  useEffect(() => {
    if (value !== null) setPickerOpen(true);
  }, [value]);
  const mechanics = useAvailableMechanics(
    lat !== null && lng !== null ? { lat, lng } : {},
  );
  const items = mechanics.data?.mechanics ?? [];
  const pickedName =
    items.find((item) => item.id === value)?.displayName ?? null;

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-2">
      <legend className="sr-only">Thợ sửa xe</legend>

      <label className={cardClasses(!pickerOpen)}>
        <input
          type="radio"
          name="mechanicMode"
          checked={!pickerOpen}
          onChange={() => {
            setPickerOpen(false);
            onChange(null);
          }}
          className="h-4 w-4 shrink-0 accent-zinc-900 dark:accent-white"
        />
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Để hệ thống tự điều thợ gần nhất
        </span>
      </label>

      <label className={cardClasses(pickerOpen)}>
        <input
          type="radio"
          name="mechanicMode"
          checked={pickerOpen}
          onChange={() => setPickerOpen(true)}
          className="h-4 w-4 shrink-0 accent-zinc-900 dark:accent-white"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Chọn thợ mình thích
          </span>
          {pickedName && (
            <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              Đã chọn: {pickedName}
            </span>
          )}
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-zinc-500 motion-safe:transition-transform motion-safe:duration-200 ${
            pickerOpen ? "rotate-180" : ""
          }`}
        />
      </label>

      {pickerOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
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

          {mechanics.isSuccess &&
            items.map((item) => (
              <MechanicPickerCard
                key={item.id}
                item={item}
                selected={value === item.id}
                onSelect={onChange}
              />
            ))}

          {mechanics.isSuccess && items.length === 0 && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Hiện chưa có thợ trực tuyến. Cứ giữ “tự điều thợ”, đơn của bạn sẽ
              được điều phối ngay khi có thợ rảnh.
            </p>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="text-[11px] font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
