"use client";

import Link from "next/link";
import { FiChevronsLeft, FiChevronsRight, FiHome, FiX } from "react-icons/fi";
import { ADMIN_SECTIONS, type AdminSectionId } from "./admin-sections";

type AdminSidebarProps = {
  active: AdminSectionId;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

// Sidebar owns navigation only. Visual language matches bento cards:
// rounded-2xl surfaces, zinc borders, monochrome active state.
export function AdminSidebar({
  active,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-zinc-950/50 md:hidden"
        />
      )}

      <aside
        aria-label="Menu quản trị"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 motion-safe:ease-out md:static md:z-auto md:shrink-0 dark:border-zinc-800 dark:bg-zinc-950 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
          {!collapsed && (
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900"
              >
                FW
              </span>
              <span className="truncate text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Trang quản trị
              </span>
            </span>
          )}
          {collapsed && (
            <span
              aria-hidden="true"
              className="mx-auto hidden h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-bold text-white md:flex dark:bg-white dark:text-zinc-900"
            >
              FW
            </span>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng menu quản trị"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="Chức năng quản trị"
          className="flex-1 overflow-y-auto p-3"
        >
          <ul className="flex flex-col gap-1.5">
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon;
              const selected = section.id === active;
              return (
                <li key={section.id}>
                  <Link
                    href={section.href}
                    onClick={onCloseMobile}
                    aria-current={selected ? "page" : undefined}
                    title={collapsed ? section.label : undefined}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                      selected
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    } ${collapsed ? "md:justify-center md:px-0" : ""}`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {section.label}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs ${
                            selected
                              ? "text-zinc-300 dark:text-zinc-600"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {section.description}
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {!collapsed && (
            <div className="mt-4 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-zinc-900 motion-safe:animate-pulse dark:bg-zinc-100"
                />
                Hệ thống ổn định
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                3 nhóm dịch vụ đang hoạt động bình thường.
              </p>
            </div>
          )}
        </nav>

        <div className="flex flex-col gap-1.5 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <Link
            href="/"
            onClick={onCloseMobile}
            title={collapsed ? "Về trang chủ" : undefined}
            className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:text-zinc-300 dark:hover:bg-zinc-900 ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
          >
            <FiHome aria-hidden="true" className="h-4 w-4 shrink-0" />
            {!collapsed && "Về trang chủ"}
          </Link>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            className="hidden min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] md:flex dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {collapsed ? (
              <FiChevronsRight aria-hidden="true" className="h-4 w-4" />
            ) : (
              <>
                <FiChevronsLeft aria-hidden="true" className="h-4 w-4" />
                Thu gọn
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
