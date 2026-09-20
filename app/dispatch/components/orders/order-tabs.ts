// One URL per order-status tab so links stay shareable and the browser
// back button works. Mirrors the dispatch bookings tabs.
import type { IconType } from "react-icons";
import {
  FiBox,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiRotateCcw,
  FiTruck,
  FiX,
} from "react-icons/fi";
import type { OrderStatus } from "@/lib/orders/orders.types";

export type DispatchOrderTab = OrderStatus;

export type DispatchOrderTabDef = {
  id: DispatchOrderTab;
  label: string;
  href: string;
  icon: IconType;
};

function tabHref(id: DispatchOrderTab): string {
  return `/dispatch/orders/${id}`;
}

export const DEFAULT_ORDER_TAB: DispatchOrderTab = "pending";

export const ORDER_TAB_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

export const DISPATCH_ORDER_TABS: DispatchOrderTabDef[] = [
  {
    id: "pending",
    label: ORDER_TAB_LABELS.pending,
    href: tabHref("pending"),
    icon: FiClock,
  },
  {
    id: "confirmed",
    label: ORDER_TAB_LABELS.confirmed,
    href: tabHref("confirmed"),
    icon: FiCheckCircle,
  },
  {
    id: "packing",
    label: ORDER_TAB_LABELS.packing,
    href: tabHref("packing"),
    icon: FiBox,
  },
  {
    id: "shipping",
    label: ORDER_TAB_LABELS.shipping,
    href: tabHref("shipping"),
    icon: FiTruck,
  },
  {
    id: "delivered",
    label: ORDER_TAB_LABELS.delivered,
    href: tabHref("delivered"),
    icon: FiCheck,
  },
  {
    id: "cancelled",
    label: ORDER_TAB_LABELS.cancelled,
    href: tabHref("cancelled"),
    icon: FiX,
  },
  {
    id: "refunded",
    label: ORDER_TAB_LABELS.refunded,
    href: tabHref("refunded"),
    icon: FiRotateCcw,
  },
];

export function isDispatchOrderTab(value: unknown): value is DispatchOrderTab {
  return DISPATCH_ORDER_TABS.some((tab) => tab.id === value);
}
