"use client";

import Link from "next/link";
import {
  FiChevronsLeft,
  FiChevronsRight,
  FiHome,
  FiLogOut,
} from "react-icons/fi";
import { SCROLLBAR_ON_NAVY_CLASSES } from "@/components/ui/scrollbar";
import type { StaffNavGroup } from "./staff-shell.types";
import { STAFF_ON_NAVY_FOCUS, STAFF_RAIL_BUTTON } from "./staff-ui";

type StaffNavRailProps = {
  groups: StaffNavGroup[];
  selectedGroup: string;
  groupBadges: Record<string, number>;
  collapsed: boolean;
  onSelectGroup: (groupId: string) => void;
  onLogout?: () => void;
  onToggleCollapse: () => void;
  onNavigate: () => void;
};

// Dark icon column of the two-part staff sidebar: brand tile, one button
// per nav group, and the home / logout / collapse actions at the bottom.
export function StaffNavRail({
  groups,
  selectedGroup,
  groupBadges,
  collapsed,
  onSelectGroup,
  onLogout,
  onToggleCollapse,
  onNavigate,
}: StaffNavRailProps) {
  return (
    <div className="flex w-[72px] shrink-0 flex-col items-center gap-2 bg-[#152C48] py-3">
      <span
        aria-hidden="true"
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-extrabold text-[#1E3A5F]"
      >
        FW
      </span>

      <fieldset
        aria-label="Nhóm chức năng"
        className={`m-0 flex w-full min-w-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto border-0 p-0 ${SCROLLBAR_ON_NAVY_CLASSES}`}
      >
        {groups.map((group) => {
          const Icon = group.icon;
          const selected = group.id === selectedGroup && !collapsed;
          const pending = groupBadges[group.id] ?? 0;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectGroup(group.id)}
              aria-pressed={selected}
              aria-label={
                pending > 0 ? `${group.label}, ${pending} mục chờ` : group.label
              }
              title={group.label}
              className={`relative flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition-colors duration-200 ${STAFF_ON_NAVY_FOCUS} ${
                selected
                  ? "bg-[#1E3A5F] text-white ring-1 ring-white/20"
                  : "text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span className="max-w-full truncate px-1 text-[10px] font-semibold">
                {group.shortLabel}
              </span>
              {pending > 0 && !selected && (
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#152C48] bg-white"
                />
              )}
            </button>
          );
        })}
      </fieldset>

      <Link
        href="/"
        onClick={onNavigate}
        aria-label="Về trang chủ"
        title="Về trang chủ"
        className={STAFF_RAIL_BUTTON}
      >
        <FiHome aria-hidden="true" className="h-5 w-5" />
      </Link>
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className={STAFF_RAIL_BUTTON}
        >
          <FiLogOut aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        className={`${STAFF_RAIL_BUTTON} max-md:hidden`}
      >
        {collapsed ? (
          <FiChevronsRight aria-hidden="true" className="h-5 w-5" />
        ) : (
          <FiChevronsLeft aria-hidden="true" className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
