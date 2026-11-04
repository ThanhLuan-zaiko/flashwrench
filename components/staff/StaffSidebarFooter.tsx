import Link from "next/link";
import { FiHome, FiLogOut } from "react-icons/fi";
import {
  STAFF_NAV_ROW_BASE,
  STAFF_NAV_ROW_IDLE,
  STAFF_ON_YELLOW_FOCUS,
  staffLabelClass,
} from "./staff-ui";

type StaffSidebarFooterProps = {
  collapsed: boolean;
  onLogout?: () => void;
  onNavigate: () => void;
};

// Home and logout actions pinned to the bottom of the sidebar. Labels fade
// out on the collapsed desktop rail; the icons stay.
export function StaffSidebarFooter({
  collapsed,
  onLogout,
  onNavigate,
}: StaffSidebarFooterProps) {
  const rowClass = `${STAFF_NAV_ROW_BASE} ${STAFF_NAV_ROW_IDLE} ${STAFF_ON_YELLOW_FOCUS} ${
    collapsed ? "md:justify-center md:px-0" : ""
  }`;
  const labelClass = staffLabelClass(collapsed);

  return (
    <div className="flex shrink-0 flex-col gap-1 border-t border-[#111111]/10 pt-2">
      <Link
        href="/"
        onClick={onNavigate}
        title="Về trang chủ"
        className={rowClass}
      >
        <FiHome aria-hidden="true" className="h-5 w-5 shrink-0" />
        <span className={labelClass}>Về trang chủ</span>
      </Link>
      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          title="Đăng xuất"
          className={rowClass}
        >
          <FiLogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span className={labelClass}>Đăng xuất</span>
        </button>
      )}
    </div>
  );
}
