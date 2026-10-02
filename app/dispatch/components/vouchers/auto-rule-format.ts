// Vietnamese UI copy for auto-grant rules: trigger picker labels, the
// one-line rule description shown on cards and the near-milestone phrasing.
import type { AutoTrigger } from "@/lib/vouchers/auto-rule.types";
import { formatVnd } from "../bookings/dispatch-format";

export const AUTO_TRIGGER_OPTIONS: {
  value: AutoTrigger;
  label: string;
}[] = [
  { value: "signup", label: "Khách đăng ký tài khoản mới" },
  { value: "booking_count", label: "Đủ số lần sửa xe hoàn thành" },
  { value: "order_count", label: "Đủ số đơn linh kiện đã giao" },
  { value: "order_value", label: "Đơn linh kiện đạt giá trị tối thiểu" },
  { value: "spend_total", label: "Đủ mốc chi tiêu tích lũy" },
  { value: "review_created", label: "Khách gửi đánh giá mới" },
  { value: "win_back", label: "Khách quay lại sau thời gian vắng" },
];

export function triggerLabel(trigger: AutoTrigger): string {
  return (
    AUTO_TRIGGER_OPTIONS.find((option) => option.value === trigger)?.label ??
    trigger
  );
}

// Field labels for the numeric inputs, which only exist on some triggers.
export function thresholdInputLabel(trigger: AutoTrigger): string | null {
  switch (trigger) {
    case "booking_count":
      return "Số lần sửa xong để thưởng";
    case "order_count":
      return "Số đơn đã giao để thưởng";
    case "order_value":
      return "Giá trị đơn tối thiểu (đ)";
    case "spend_total":
      return "Mỗi mốc chi tiêu (đ)";
    case "win_back":
      return null;
    default:
      return null;
  }
}

export function windowDaysInputLabel(trigger: AutoTrigger): string | null {
  return trigger === "win_back" ? "Số ngày không hoạt động" : null;
}

// One-line description for a rule card, e.g. "Mỗi 5 lần sửa xong".
export function describeRule(rule: {
  triggerType: AutoTrigger;
  threshold: number;
  windowDays: number;
}): string {
  switch (rule.triggerType) {
    case "signup":
      return "Phát khi khách đăng ký tài khoản";
    case "booking_count":
      return `Mỗi ${rule.threshold} lần sửa xong`;
    case "order_count":
      return `Mỗi ${rule.threshold} đơn đã giao`;
    case "order_value":
      return `Đơn đã giao từ ${formatVnd(rule.threshold)}`;
    case "spend_total":
      return `Mỗi ${formatVnd(rule.threshold)} chi tiêu`;
    case "review_created":
      return "Mỗi đánh giá khách gửi";
    case "win_back":
      return `Vắng ${rule.windowDays} ngày trở lên`;
    default:
      return triggerLabel(rule.triggerType);
  }
}

// Progress phrasing for the "almost there" board.
export function describeNearMilestone(entry: {
  triggerType: AutoTrigger;
  current: number;
  threshold: number;
}): string {
  switch (entry.triggerType) {
    case "booking_count":
      return `Đã sửa xong ${entry.current} lần — còn 1 lần nữa là đạt mốc ${entry.threshold}`;
    case "order_count":
      return `Đã giao ${entry.current} đơn — còn 1 đơn nữa là đạt mốc ${entry.threshold}`;
    case "spend_total": {
      const remaining = entry.threshold - (entry.current % entry.threshold);
      return `Đã chi ${formatVnd(entry.current)} — còn ${formatVnd(remaining)} nữa là đạt mốc`;
    }
    default:
      return describeRule({
        triggerType: entry.triggerType,
        threshold: entry.threshold,
        windowDays: 0,
      });
  }
}
