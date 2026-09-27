"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RescueBoard } from "./RescueBoard";
import {
  DEFAULT_RESCUE_TAB,
  isRescueBoardTab,
  RESCUE_BOARD_TABS,
} from "./rescue-tabs";

// Mounted once by the /dispatch/rescue layout, so tab switches reuse the
// screen without remounting. Unknown slugs get guidance, never another
// tab's data.
export function RescueRouteShell() {
  const params = useParams();
  const raw = params.status;
  const status = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);

  if (!isRescueBoardTab(status)) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Trạng thái cứu hộ này không tồn tại
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {RESCUE_BOARD_TABS.map((entry) => {
            const EntryIcon = entry.icon;
            return (
              <Link
                key={entry.id}
                href={entry.href}
                scroll={false}
                prefetch
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                <EntryIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {entry.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-4">
          <Link
            href={
              RESCUE_BOARD_TABS.find((t) => t.id === DEFAULT_RESCUE_TAB)
                ?.href ?? "/dispatch/rescue/open"
            }
            scroll={false}
            prefetch
            className="text-xs font-semibold text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-200"
          >
            Về cứu hộ chờ thợ
          </Link>
        </div>
      </div>
    );
  }

  return <RescueBoard status={status} />;
}
