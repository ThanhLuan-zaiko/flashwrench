"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";
import { SCROLLBAR_ON_NAVY_CLASSES } from "@/components/ui/scrollbar";
import type { StaffNavSection, StaffShellCopy } from "./staff-shell.types";
import {
  STAFF_NAV_LINK_ACTIVE,
  STAFF_NAV_LINK_IDLE,
  STAFF_NAV_PANEL_LINK,
  STAFF_ON_NAVY_FOCUS,
} from "./staff-ui";

type StaffNavPanelProps = {
  copy: StaffShellCopy;
  groupLabel: string;
  sections: StaffNavSection[];
  active: string;
  badges?: Partial<Record<string, number>>;
  panel?: ReactNode;
  onCloseMobile: () => void;
};

// Label column of the two-part staff sidebar: the selected group's
// sections with their descriptions, plus the portal's optional panel.
export function StaffNavPanel({
  copy,
  groupLabel,
  sections,
  active,
  badges,
  panel,
  onCloseMobile,
}: StaffNavPanelProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col border-l border-white/10">
      <div className="flex items-start justify-between gap-2 px-4 pt-5 pb-3">
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase">
            {copy.areaName}
          </span>
          <span className="mt-0.5 block truncate text-xl font-extrabold tracking-tight">
            {groupLabel}
          </span>
        </span>
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
        aria-label={`Chức năng ${copy.scope}: ${groupLabel}`}
        className={`flex-1 overflow-y-auto px-2.5 pb-3 ${SCROLLBAR_ON_NAVY_CLASSES}`}
      >
        <ul className="flex flex-col gap-1">
          {sections.map((section) => {
            const selected = section.id === active;
            const badge = badges?.[section.id] ?? 0;
            return (
              <li key={section.id}>
                <Link
                  href={section.href}
                  onClick={onCloseMobile}
                  aria-current={selected ? "page" : undefined}
                  className={`${STAFF_NAV_PANEL_LINK} ${
                    selected ? STAFF_NAV_LINK_ACTIVE : STAFF_NAV_LINK_IDLE
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">
                      {section.label}
                    </span>
                    {badge > 0 && (
                      <span
                        aria-hidden="true"
                        className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                          selected
                            ? "bg-[#1E3A5F] text-white"
                            : "bg-white/15 text-white"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs leading-snug ${
                      selected ? "text-zinc-600" : "text-zinc-300"
                    }`}
                  >
                    {section.description}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {panel && (
          <div className="mt-4 rounded-2xl bg-white p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            {panel}
          </div>
        )}
      </nav>
    </div>
  );
}
