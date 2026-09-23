"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiPackage, FiTool } from "react-icons/fi";

const HISTORY_TABS = [
  { href: "/history", label: "Đơn sửa xe", icon: FiTool },
  { href: "/history/orders", label: "Đơn mua linh kiện", icon: FiPackage },
] as const;

// URL tabs for the /history segment: real Links so a switch keeps the
// browser back button honest and reuses cached queries without remounting
// the whole shell.
export function HistoryTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Nhóm lịch sử" className="flex flex-wrap gap-2">
      {HISTORY_TABS.map((tab) => {
        const active =
          tab.href === "/history"
            ? pathname === "/history"
            : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
              active
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
