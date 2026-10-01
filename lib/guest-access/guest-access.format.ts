// Formatting and status labels shared by the lookup screen and the PDF
// renderer, so a document never disagrees with the page it was downloaded
// from. Framework-free on purpose: the PDF is generated server-side and must
// not import a component module.
import { formatDateTime } from "@/lib/datetime/format";

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

// Raw status values are English enums stored in ScyllaDB; every surface that
// shows them needs the Vietnamese label.
const RECORD_STATUS_LABELS: Record<string, string> = {
  pending: "Đang chờ",
  confirmed: "Đã xác nhận",
  mechanic_assigned: "Thợ đã nhận",
  en_route: "Thợ đang đến",
  in_progress: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Không gặp được",
  open: "Đang mở",
  dispatched: "Đã điều phái",
  arrived: "Thợ đã tới",
  resolved: "Đã xử lý",
  expired: "Đã hết hạn",
  packed: "Đang đóng gói",
  shipped: "Đang giao",
  delivered: "Đã giao",
  returned: "Đã trả lại",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  partial: "Thanh toán một phần",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Tiền mặt",
  counter: "Tại cửa hàng",
  bank_transfer: "Chuyển khoản",
};

export function recordStatusLabel(status: string): string {
  return RECORD_STATUS_LABELS[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

/**
 * Documents read better with a compact timestamp. Same explicit-zone rule as
 * the screen formatter, so the PDF never shows a different local time.
 */
export function formatInvoiceDate(value: string | null | undefined): string {
  if (!value) return "—";
  return formatDateTime(value, { withZoneSuffix: true });
}
