"use client";

import { type ReactNode, useState } from "react";
import { SCROLLBAR_ON_ORANGE_CLASSES } from "@/components/ui/scrollbar";
import { StaffNavGroups } from "./StaffNavGroups";
import { StaffSidebarFooter } from "./StaffSidebarFooter";
import { StaffSidebarHeader } from "./StaffSidebarHeader";
import { groupBadgeTotal, groupIdForSection } from "./staff-nav-groups";
import type {
  StaffNavGroup,
  StaffNavSection,
  StaffShellCopy,
} from "./staff-shell.types";

type StaffSidebarProps = {
  copy: StaffShellCopy;
  groups: StaffNavGroup[];
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

// Rounded orange sidebar shared by every staff portal. Desktop shows a 248px
// column that collapses to a 72px icon rail; phones get a drawer. The
// selected group opens its sections as a tree; picking a group while
// collapsed expands the sidebar again.
export function StaffSidebar({
  copy,
  groups,
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
  const activeGroup = groupIdForSection(groups, sections, active);
  const [selectedGroup, setSelectedGroup] = useState(activeGroup);
  const [syncedActive, setSyncedActive] = useState(active);
  // Navigating elsewhere re-opens the group that owns the new section.
  if (syncedActive !== active) {
    setSyncedActive(active);
    setSelectedGroup(activeGroup);
  }

  const group = groups.find((item) => item.id === selectedGroup) ?? groups[0];
  const groupBadges = Object.fromEntries(
    groups.map((item) => [item.id, groupBadgeTotal(sections, item.id, badges)]),
  );

  const selectGroup = (groupId: string) => {
    setSelectedGroup(groupId);
    if (collapsed) onToggleCollapse();
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label={`Đóng menu ${copy.scope}`}
          onClick={onCloseMobile}
          className="fixed inset-0 z-[55] bg-[#111111]/50 md:hidden"
        />
      )}

      <aside
        aria-label={`Menu ${copy.scope}`}
        className={`fixed inset-y-0 left-0 z-[60] flex select-none w-[286px] max-w-[88vw] flex-col gap-3 rounded-r-3xl bg-[#FB923C] p-3 text-[#111111] duration-200 motion-safe:transition-[width,transform] motion-safe:ease-out md:sticky md:top-[76px] md:z-30 md:m-3 md:h-[calc(100vh-5.5rem)] md:shrink-0 md:self-start md:rounded-3xl md:border md:border-[#111111]/10 ${
          collapsed ? "md:w-[72px]" : "md:w-[248px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <StaffSidebarHeader
          copy={copy}
          groupLabel={group?.label ?? copy.areaName}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onCloseMobile={onCloseMobile}
        />

        <nav
          aria-label={`Chức năng ${copy.scope}`}
          className={`flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain ${SCROLLBAR_ON_ORANGE_CLASSES}`}
        >
          <StaffNavGroups
            groups={groups}
            sections={sections}
            active={active}
            selectedGroup={group?.id ?? ""}
            groupBadges={groupBadges}
            badges={badges}
            collapsed={collapsed}
            onSelectGroup={selectGroup}
            onNavigate={onCloseMobile}
          />
          {panel && (
            <div
              className={`mt-3 rounded-2xl bg-white p-3 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${
                collapsed ? "md:hidden" : ""
              }`}
            >
              {panel}
            </div>
          )}
        </nav>

        <StaffSidebarFooter
          collapsed={collapsed}
          onLogout={onLogout}
          onNavigate={onCloseMobile}
        />
      </aside>
    </>
  );
}
