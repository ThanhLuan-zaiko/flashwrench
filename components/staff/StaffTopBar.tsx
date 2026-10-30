"use client";

import type { ReactNode } from "react";
import { FiSidebar } from "react-icons/fi";
import { TourButton } from "@/components/tour/TourButton";
import { getStaffInitials } from "./staff-format";
import type { StaffNavSection, StaffShellCopy } from "./staff-shell.types";
import { STAFF_AVATAR, STAFF_ICON_TILE } from "./staff-ui";

type StaffTopBarProps = {
  copy: StaffShellCopy;
  section: StaffNavSection;
  tour: string;
  status?: ReactNode;
  displayName?: string | null;
  maxWidthClass: string;
  onOpenMenu: () => void;
};

// Sticky section bar under the navy site header: navy icon tile, navy
// section title in the homepage headline style, live status and tour.
// The header is 48px tall on phones and 64px from `sm` up.
export function StaffTopBar({
  copy,
  section,
  tour,
  status,
  displayName,
  maxWidthClass,
  onOpenMenu,
}: StaffTopBarProps) {
  const SectionIcon = section.icon;

  return (
    <div className="sticky top-12 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur sm:top-16 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div
        className={`mx-auto flex min-h-16 w-full items-center gap-3 px-4 py-3 sm:px-6 ${maxWidthClass}`}
      >
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={`Mở menu ${copy.scope}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] motion-safe:active:scale-95 md:hidden dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-100"
        >
          <FiSidebar aria-hidden="true" className="h-5 w-5" />
        </button>
        <span className={`${STAFF_ICON_TILE} max-sm:hidden`}>
          <SectionIcon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="hidden truncate text-[11px] font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase sm:block dark:text-zinc-400">
            {copy.areaName}
          </p>
          <h1 className="truncate text-base leading-tight font-extrabold tracking-tight text-[#1E3A5F] sm:text-xl dark:text-zinc-50">
            {section.label}
          </h1>
          <p className="truncate text-xs text-zinc-500 sm:hidden dark:text-zinc-400">
            {section.description}
          </p>
        </div>
        {status}
        <TourButton tour={tour} ariaLabel={`Hướng dẫn ${section.label}`} />
        {displayName !== undefined && (
          <span
            className={`${STAFF_AVATAR} max-sm:hidden`}
            title={displayName ?? undefined}
          >
            {getStaffInitials(displayName ?? "")}
          </span>
        )}
      </div>
    </div>
  );
}
