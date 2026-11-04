import { FiChevronsLeft, FiChevronsRight, FiX } from "react-icons/fi";
import type { StaffShellCopy } from "./staff-shell.types";
import { STAFF_ICON_BUTTON, staffLabelClass } from "./staff-ui";

type StaffSidebarHeaderProps = {
  copy: StaffShellCopy;
  groupLabel: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

// Brand tile, the selected group's name and the collapse / close controls.
// On the 72px desktop rail the tile and toggle stack vertically and the
// name hides.
export function StaffSidebarHeader({
  copy,
  groupLabel,
  collapsed,
  onToggleCollapse,
  onCloseMobile,
}: StaffSidebarHeaderProps) {
  const ToggleIcon = collapsed ? FiChevronsRight : FiChevronsLeft;
  const toggleLabel = collapsed ? "Mở rộng menu" : "Thu gọn menu";

  return (
    <div
      className={`flex items-center gap-2 ${collapsed ? "md:flex-col" : ""}`}
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-sm font-extrabold text-[#FB923C]"
      >
        FW
      </span>
      <span className={`min-w-0 flex-1 ${staffLabelClass(collapsed)}`}>
        <span className="block truncate text-xs font-bold tracking-[0.14em] text-[#111111]/80 uppercase">
          {copy.areaName}
        </span>
        <span className="block truncate text-base font-extrabold tracking-tight text-[#111111]">
          {groupLabel}
        </span>
      </span>
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={`${STAFF_ICON_BUTTON} max-md:hidden`}
      >
        <ToggleIcon aria-hidden="true" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onCloseMobile}
        aria-label={`Đóng menu ${copy.scope}`}
        className={`${STAFF_ICON_BUTTON} md:hidden`}
      >
        <FiX aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}
