// One URL per schedule filter tab so links stay shareable and the browser
// back button works. Mirrors the admin catalog/user tab helpers.
import type { IconType } from "react-icons";
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiNavigation,
  FiTool,
  FiUserCheck,
  FiX,
} from "react-icons/fi";

export type ScheduleTab =
  | "all"
  | "pending"
  | "confirmed"
  | "mechanic_assigned"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ScheduleTabDef = {
  id: ScheduleTab;
  label: string;
  href: string;
  icon: IconType;
};

function tabHref(id: ScheduleTab): string {
  return `/mechanic/schedule/${id}`;
}

export const SCHEDULE_TABS: ScheduleTabDef[] = [
  { id: "all", label: "Tất cả", href: tabHref("all"), icon: FiLayers },
  {
    id: "pending",
    label: "Chờ nhận đơn",
    href: tabHref("pending"),
    icon: FiClock,
  },
  {
    id: "confirmed",
    label: "Đã xác nhận",
    href: tabHref("confirmed"),
    icon: FiCheckCircle,
  },
  {
    id: "mechanic_assigned",
    label: "Đã nhận đơn",
    href: tabHref("mechanic_assigned"),
    icon: FiUserCheck,
  },
  {
    id: "en_route",
    label: "Đang di chuyển",
    href: tabHref("en_route"),
    icon: FiNavigation,
  },
  {
    id: "in_progress",
    label: "Đang sửa xe",
    href: tabHref("in_progress"),
    icon: FiTool,
  },
  {
    id: "completed",
    label: "Hoàn thành",
    href: tabHref("completed"),
    icon: FiCheck,
  },
  {
    id: "cancelled",
    label: "Đã hủy",
    href: tabHref("cancelled"),
    icon: FiX,
  },
];

export function isScheduleTab(value: unknown): value is ScheduleTab {
  return SCHEDULE_TABS.some((tab) => tab.id === value);
}

export function shouldResetSchedulePager(
  previous: ScheduleTab,
  next: ScheduleTab,
): boolean {
  return previous !== next;
}

export function scheduleTabHref(id: ScheduleTab): string {
  return tabHref(id);
}
