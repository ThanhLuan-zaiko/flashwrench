"use client";

import { FiCircle } from "react-icons/fi";
import { formatDateTime } from "@/lib/datetime/format";
import type { MechanicBookingTimelineEntry } from "@/lib/mechanic/mechanic.types";
import { STATUS_LABELS } from "@/lib/mechanic/mechanic-status";

type BookingTimelineProps = {
  timeline: MechanicBookingTimelineEntry[];
};

// Vertical audit trail of every status transition the booking went
// through, newest last.
export function BookingTimeline({ timeline }: BookingTimelineProps) {
  if (timeline.length === 0) return null;
  return (
    <ol className="flex flex-col gap-0">
      {timeline.map((entry, index) => (
        <li
          key={`${entry.at ?? index}-${entry.to}`}
          className="relative flex gap-3 pb-4 last:pb-0"
        >
          {index < timeline.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-[5px] top-4 h-full w-px bg-zinc-200 dark:bg-zinc-800"
            />
          )}
          <FiCircle
            aria-hidden="true"
            className="mt-1 h-3 w-3 shrink-0 fill-zinc-400 text-zinc-400 dark:fill-zinc-500 dark:text-zinc-500"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {STATUS_LABELS[entry.to]}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDateTime(entry.at, { withZoneSuffix: false })}
            </p>
            {entry.note && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {entry.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
