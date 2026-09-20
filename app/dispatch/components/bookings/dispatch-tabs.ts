// One URL per status tab so links stay shareable and the browser back
// button works. Mirrors the mechanic schedule and admin catalog tabs.
import type { IconType } from "react-icons";
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiNavigation,
  FiTool,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";

export type DispatchTab = MechanicBookingStatus;

export type DispatchTabDef = {
  id: DispatchTab;
  label: string;
  href: string;
  icon: IconType;
};

function tabHref(id: DispatchTab): string {
  return `/dispatch/bookings/${id}`;
}

export const DEFAULT_DISPATCH_TAB: DispatchTab = "pending";

// Dispatcher-facing labels: "pending" reads as work waiting on the
// dispatcher, not on the mechanic.
export const DISPATCH_STATUS_LABELS: Record<MechanicBookingStatus, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  mechanic_assigned: "Thợ đã nhận",
  en_route: "Đang di chuyển",
  in_progress: "Đang sửa xe",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Khách vắng mặt",
};

export const DISPATCH_TABS: DispatchTabDef[] = [
  {
    id: "pending",
    label: DISPATCH_STATUS_LABELS.pending,
    href: tabHref("pending"),
    icon: FiClock,
  },
  {
    id: "confirmed",
    label: DISPATCH_STATUS_LABELS.confirmed,
    href: tabHref("confirmed"),
    icon: FiCheckCircle,
  },
  {
    id: "mechanic_assigned",
    label: DISPATCH_STATUS_LABELS.mechanic_assigned,
    href: tabHref("mechanic_assigned"),
    icon: FiUserCheck,
  },
  {
    id: "en_route",
    label: DISPATCH_STATUS_LABELS.en_route,
    href: tabHref("en_route"),
    icon: FiNavigation,
  },
  {
    id: "in_progress",
    label: DISPATCH_STATUS_LABELS.in_progress,
    href: tabHref("in_progress"),
    icon: FiTool,
  },
  {
    id: "completed",
    label: DISPATCH_STATUS_LABELS.completed,
    href: tabHref("completed"),
    icon: FiCheck,
  },
  {
    id: "cancelled",
    label: DISPATCH_STATUS_LABELS.cancelled,
    href: tabHref("cancelled"),
    icon: FiX,
  },
  {
    id: "no_show",
    label: DISPATCH_STATUS_LABELS.no_show,
    href: tabHref("no_show"),
    icon: FiUserX,
  },
];

export function isDispatchTab(value: unknown): value is DispatchTab {
  return DISPATCH_TABS.some((tab) => tab.id === value);
}

export function dispatchTabHref(id: DispatchTab): string {
  return tabHref(id);
}
