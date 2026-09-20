import type { OrderStatus } from "@/lib/orders/orders.types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
};

// Monochrome badges: borders + text contrast only, per the palette rule.
// Terminal states (cancelled/refunded) get a dimmed treatment; in-flight
// states stay neutral.
export function orderStatusBadgeClass(status: OrderStatus): string {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";
  if (status === "cancelled" || status === "refunded") {
    return `${base} border-zinc-300 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400`;
  }
  if (status === "delivered") {
    return `${base} border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900`;
  }
  return `${base} border-zinc-400 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300`;
}

// Customers may cancel only while the order is still pending.
export function canCustomerCancel(status: OrderStatus): boolean {
  return status === "pending";
}
