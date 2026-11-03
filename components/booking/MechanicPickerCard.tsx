"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import type { MechanicDirectoryItem } from "@/lib/mechanic/mechanic-directory.service";
import { MechanicReviewsPanel } from "./MechanicReviewsPanel";

function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null) return "";
  return distanceKm < 1
    ? `Cách bạn khoảng ${Math.max(1, Math.round(distanceKm * 1000))} m`
    : `Cách bạn khoảng ${distanceKm.toFixed(1)} km`;
}

// Mechanic rows are ruled list rows; the selected row takes a tinted surface
// and a bold name, not a bordered box.
export function mechanicRowClasses(active: boolean): string {
  return `flex min-h-11 cursor-pointer items-center gap-3 border-b border-zinc-200 py-3 transition-colors duration-200 dark:border-zinc-800 ${
    active ? "bg-zinc-50 dark:bg-zinc-900" : ""
  }`;
}

// One mechanic in the booking picker: radio select plus an expandable public
// review feed (booking + rescue reviews combined).
export function MechanicPickerCard({
  item,
  selected,
  onSelect,
}: {
  item: MechanicDirectoryItem;
  selected: boolean;
  onSelect: (mechanicId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <label className={mechanicRowClasses(selected)}>
        <input
          type="radio"
          name="mechanicPick"
          checked={selected}
          onChange={() => onSelect(item.id)}
          aria-label={`Chọn thợ ${item.displayName}`}
          className="h-4 w-4 shrink-0 accent-zinc-900 dark:accent-white"
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm text-zinc-900 dark:text-zinc-50 ${
              selected ? "font-bold" : "font-semibold"
            }`}
          >
            {item.displayName}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {item.ratingCount > 0
                ? `${item.ratingAvg.toFixed(1)} (${item.ratingCount} đánh giá)`
                : "Chưa có đánh giá"}{" "}
              · {item.completedJobs} đơn
            </span>
            {item.distanceKm !== null && (
              <span>{formatDistance(item.distanceKm)}</span>
            )}
            <span>Đang trực tuyến</span>
          </span>
          {item.skills.length > 0 && (
            <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {item.skills.join(" · ")}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={`Xem đánh giá của thợ ${item.displayName}`}
          className="flex min-h-11 shrink-0 items-center gap-1 text-xs font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300"
        >
          Đánh giá
          <FiChevronDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </label>

      {open && <MechanicReviewsPanel mechanicId={item.id} />}
    </div>
  );
}
