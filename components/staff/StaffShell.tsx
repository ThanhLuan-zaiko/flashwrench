"use client";

import { type ReactNode, useState } from "react";
import { StaffSidebar } from "./StaffSidebar";
import { StaffTopBar } from "./StaffTopBar";
import type { StaffNavSection, StaffShellCopy } from "./staff-shell.types";

type StaffShellProps = {
  copy: StaffShellCopy;
  sections: StaffNavSection[];
  section: StaffNavSection;
  tour: string;
  badges?: Partial<Record<string, number>>;
  panel?: ReactNode;
  status?: ReactNode;
  displayName?: string | null;
  maxWidthClass?: string;
  onLogout?: () => void;
  children: ReactNode;
};

// Layout-only frame shared by the dispatch, mechanic and admin portals:
// navy sidebar, sticky section bar and a centered content column. Each
// portal shell keeps its own realtime hooks and passes copy plus slots.
export function StaffShell({
  copy,
  sections,
  section,
  tour,
  badges,
  panel,
  status,
  displayName,
  maxWidthClass = "max-w-7xl",
  onLogout,
  children,
}: StaffShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex w-full flex-1 items-stretch bg-zinc-50 dark:bg-zinc-950">
      <StaffSidebar
        copy={copy}
        sections={sections}
        active={section.id}
        badges={badges}
        panel={panel}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onLogout={onLogout}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <StaffTopBar
          copy={copy}
          section={section}
          tour={tour}
          status={status}
          displayName={displayName}
          maxWidthClass={maxWidthClass}
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main
          className={`mx-auto w-full flex-1 px-4 py-4 sm:px-6 md:py-6 ${maxWidthClass}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
