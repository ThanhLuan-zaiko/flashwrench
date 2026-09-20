"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DispatchBoard } from "./bookings/DispatchBoard";
import {
  DEFAULT_DISPATCH_TAB,
  DISPATCH_TABS,
  dispatchTabHref,
  isDispatchTab,
} from "./bookings/dispatch-tabs";

// Mounted once by the /dispatch/bookings layout, so it survives status-tab
// switches without remounting or replaying the enter animation. The tab
// comes from the URL on every navigation; unknown slugs get a guidance
// panel instead of silently borrowing another tab's data.
export function DispatchRouteShell() {
  const params = useParams();
  const raw = params.status;
  const status = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);

  if (!isDispatchTab(status)) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Trạng thái đơn này không tồn tại
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Hãy chọn một trạng thái bên dưới để xem danh sách đơn.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {DISPATCH_TABS.map((entry) => {
              const EntryIcon = entry.icon;
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  scroll={false}
                  prefetch
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <EntryIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {entry.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4">
            <Link
              href={dispatchTabHref(DEFAULT_DISPATCH_TAB)}
              scroll={false}
              prefetch
              className="text-xs font-semibold text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-200"
            >
              Về danh sách đơn chờ xử lý
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <DispatchBoard status={status} />;
}
