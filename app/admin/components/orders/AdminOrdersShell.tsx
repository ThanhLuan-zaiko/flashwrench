"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminOrdersBoard } from "./AdminOrdersBoard";
import { ADMIN_ORDER_TABS, isAdminOrderTab } from "./admin-order-tabs";

// Mounted once by the /admin/orders layout so status-tab switches reuse
// the screen. Unknown slugs get a guidance panel linking back to the tabs.
export function AdminOrdersShell() {
  const params = useParams();
  const raw = params.status;
  const status = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);

  if (!isAdminOrderTab(status)) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Trạng thái đơn này không tồn tại
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Hãy chọn một trạng thái bên dưới để xem danh sách đơn.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {ADMIN_ORDER_TABS.map((entry) => {
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
      </div>
    );
  }

  return <AdminOrdersBoard status={status} />;
}
