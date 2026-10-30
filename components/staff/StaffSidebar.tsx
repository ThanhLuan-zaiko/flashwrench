"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiChevronsLeft, FiChevronsRight, FiHome, FiX } from "react-icons/fi";
import { SCROLLBAR_ON_NAVY_CLASSES } from "@/components/ui/scrollbar";
import type { StaffNavSection, StaffShellCopy } from "./staff-shell.types";
import {
  STAFF_NAV_GHOST_BUTTON,
  STAFF_NAV_LINK_ACTIVE,
  STAFF_NAV_LINK_BASE,
  STAFF_NAV_LINK_IDLE,
  STAFF_NAV_OUTLINE_BUTTON,
  STAFF_ON_NAVY_FOCUS,
} from "./staff-ui";

type StaffSidebarProps = {
  copy: StaffShellCopy;
  sections: StaffNavSection[];
  active: string;
  badges?: Partial<Record<string, number>>;
  panel?: ReactNode;
  collapsed: boolean;
  mobileOpen: boolean;
  onLogout?: () => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

// Navy navigation rail shared by every staff portal. It continues the navy
// site header into an L-shaped frame; the optional panel (presence switch,
// shift note) sits on a white card so its controls keep their usual look.
export function StaffSidebar({
  copy,
  sections,
  active,
  badges,
  panel,
  collapsed,
  mobileOpen,
  onLogout,
  onToggleCollapse,
  onCloseMobile,
}: StaffSidebarProps) {
  const compact = collapsed ? "md:justify-center md:px-0" : "";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label={`Đóng menu ${copy.scope}`}
          onClick={onCloseMobile}
          className="fixed inset-0 z-[55] bg-zinc-950/50 md:hidden"
        />
      )}

      <aside
        aria-label={`Menu ${copy.scope}`}
        className={`fixed inset-y-0 left-0 z-[60] flex w-72 flex-col bg-[#1E3A5F] text-white transition-transform duration-200 motion-safe:ease-out md:sticky md:top-16 md:bottom-auto md:z-30 md:h-[calc(100vh-4rem)] md:shrink-0 md:self-start md:border-t md:border-white/10 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-4">
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold tracking-[0.14em] text-zinc-300 uppercase">
                FlashWrench
              </span>
              <span className="block truncate text-base font-extrabold tracking-tight">
                {copy.areaName}
              </span>
            </span>
          )}
          {collapsed && (
            <span
              aria-hidden="true"
              className="mx-auto hidden h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xs font-extrabold md:flex"
            >
              FW
            </span>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label={`Đóng menu ${copy.scope}`}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-100 transition-colors duration-200 hover:bg-white/10 md:hidden ${STAFF_ON_NAVY_FOCUS}`}
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label={`Chức năng ${copy.scope}`}
          className={`flex-1 overflow-y-auto p-3 ${SCROLLBAR_ON_NAVY_CLASSES}`}
        >
          <ul className="flex flex-col gap-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const selected = section.id === active;
              const badge = badges?.[section.id] ?? 0;
              return (
                <li key={section.id}>
                  <Link
                    href={section.href}
                    onClick={onCloseMobile}
                    aria-current={selected ? "page" : undefined}
                    title={collapsed ? section.label : undefined}
                    className={`${STAFF_NAV_LINK_BASE} ${
                      selected ? STAFF_NAV_LINK_ACTIVE : STAFF_NAV_LINK_IDLE
                    } ${compact}`}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">
                          {section.label}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs ${
                            selected ? "text-zinc-500" : "text-zinc-300"
                          }`}
                        >
                          {section.description}
                        </span>
                      </span>
                    )}
                    {!collapsed && badge > 0 && (
                      <span
                        aria-hidden="true"
                        className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                          selected
                            ? "bg-[#1E3A5F] text-white"
                            : "bg-white text-[#1E3A5F]"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!collapsed && panel && (
            <div className="mt-4 rounded-2xl bg-white p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
              {panel}
            </div>
          )}
        </nav>

        <div className="flex flex-col gap-1.5 border-t border-white/10 p-3">
          <Link
            href="/"
            onClick={onCloseMobile}
            title={collapsed ? "Về trang chủ" : undefined}
            className={`${STAFF_NAV_GHOST_BUTTON} ${compact}`}
          >
            <FiHome aria-hidden="true" className="h-4 w-4 shrink-0" />
            {!collapsed && "Về trang chủ"}
          </Link>
          {!collapsed && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={STAFF_NAV_OUTLINE_BUTTON}
            >
              Đăng xuất
            </button>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            className={`${STAFF_NAV_OUTLINE_BUTTON} max-md:hidden`}
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
