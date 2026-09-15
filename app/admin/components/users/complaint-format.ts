import type { ComplaintStatus } from "@/lib/complaints/complaint.types";

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: "Mới",
  in_review: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Từ chối",
};

export const COMPLAINT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "open", label: "Mới" },
  { value: "in_review", label: "Đang xử lý" },
  { value: "resolved", label: "Đã giải quyết" },
  { value: "rejected", label: "Từ chối" },
];

export const COMPLAINT_REF_LABELS: Record<string, string> = {
  booking: "Đặt lịch",
  emergency: "Cứu hộ",
  order: "Đơn hàng",
  account: "Tài khoản",
  other: "Khác",
};

export function formatViDate(value: string | null): string {
  if (!value) return "Chưa rõ";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "Chưa rõ";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(time));
}
