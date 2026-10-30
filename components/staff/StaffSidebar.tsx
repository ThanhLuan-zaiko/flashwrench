"use client";

import { type ReactNode, useState } from "react";
import { StaffNavPanel } from "./StaffNavPanel";
import { StaffNavRail } from "./StaffNavRail";
import {
  groupBadgeTotal,
  groupIdForSection,
  sectionsInGroup,
} from "./staff-nav-groups";
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

// Two-part navy sidebar shared by every staff portal: a dark icon rail of
// nav groups plus a label panel for the selected group. Collapsing keeps
// only the rail; picking a group from the collapsed rail expands it again.
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
          className="fixed inset-0 z-[55] bg-zinc-950/50 md:hidden"
        />
      )}

      <aside
        aria-label={`Menu ${copy.scope}`}
        className={`fixed inset-y-0 left-0 z-[60] flex w-[304px] max-w-[88vw] bg-[#1E3A5F] text-white transition-transform duration-200 motion-safe:ease-out md:sticky md:top-16 md:bottom-auto md:z-30 md:h-[calc(100vh-4rem)] md:max-w-none md:shrink-0 md:self-start md:border-t md:border-white/10 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${collapsed ? "md:w-[72px]" : "md:w-[304px]"}`}
      >
        <StaffNavRail
          groups={groups}
          selectedGroup={group?.id ?? ""}
          groupBadges={groupBadges}
          collapsed={collapsed}
          onSelectGroup={selectGroup}
          onLogout={onLogout}
          onToggleCollapse={onToggleCollapse}
          onNavigate={onCloseMobile}
        />
        <div className={`flex min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
          <StaffNavPanel
            copy={copy}
            groupLabel={group?.label ?? copy.areaName}
            sections={sectionsInGroup(sections, group?.id ?? "")}
            active={active}
            badges={badges}
            panel={panel}
            onCloseMobile={onCloseMobile}
          />
        </div>
      </aside>
    </>
  );
}
