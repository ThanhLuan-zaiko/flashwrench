"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiFlag, FiLifeBuoy, FiPackage, FiTool } from "react-icons/fi";

const HISTORY_TABS = [
  { href: "/history", label: "Đơn sửa xe", icon: FiTool },
  { href: "/history/orders", label: "Đơn mua linh kiện", icon: FiPackage },
  { href: "/history/rescue", label: "Cứu hộ", icon: FiLifeBuoy },
  { href: "/history/complaints", label: "Khiếu nại", icon: FiFlag },
] as const;

// URL tabs for the /history segment, drawn as text tabs with a navy rule under
// the active one (the same tab style as the rest of the customer screens).
// Real Links so the browser back button stays honest and cached queries are
// reused without remounting the shell.
export function HistoryTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Nhóm lịch sử"
      className="flex gap-5 overflow-x-auto border-b border-zinc-200 [scrollbar-width:none] dark:border-zinc-800"
    >
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
            className={`-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 text-sm font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] ${
              active
                ? "border-[#111111] text-[#111111] dark:border-zinc-100 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
