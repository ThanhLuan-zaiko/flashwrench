import type {
  PulseFunnelStage,
  PulseRescueStage,
} from "@/lib/dispatch/dispatch-pulse.types";

export const FUNNEL_LABELS: Record<PulseFunnelStage, string> = {
  waiting: "Chờ xác nhận",
  assigned: "Đã giao thợ",
  working: "Đang sửa",
  done: "Hoàn tất",
};

// Axis labels: short enough to fit under four columns on a phone.
export const FUNNEL_SHORT_LABELS: Record<PulseFunnelStage, string> = {
  waiting: "Chờ",
  assigned: "Đã giao",
  working: "Đang sửa",
  done: "Xong",
};

export const RESCUE_LABELS: Record<PulseRescueStage, string> = {
  waiting: "Chờ thợ nhận",
  moving: "Thợ đang tới",
  onsite: "Đang xử lý tại chỗ",
};

/** "0h" … "23h" for the hourly axis. */
export function hourLabels(count = 24): string[] {
  return Array.from({ length: count }, (_, hour) => `${hour}h`);
}

/** Signed percent change vs yesterday at the same hour; null without a base. */
export function changeVsYesterday(
  today: readonly number[],
  yesterday: readonly number[],
): number | null {
  const sameHours = yesterday.slice(0, today.length);
  const base = sameHours.reduce((sum, value) => sum + value, 0);
  if (base <= 0) return null;
  const current = today.reduce((sum, value) => sum + value, 0);
  return ((current - base) / base) * 100;
}

export function formatChange(percent: number | null): string {
  if (percent === null) return "Chưa có số liệu hôm qua để so sánh";
  const rounded = Math.round(percent);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}% so với cùng giờ hôm qua`;
}

export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/** Wait longer than this turns the rescue timer red. */
export const RESCUE_WAIT_ALERT_MS = 10 * 60 * 1000;

export const RESCUE_STATUS_LABELS: Record<string, string> = {
  open: "Chờ thợ nhận",
  dispatched: "Đang tìm thợ",
  accepted: "Thợ đã nhận",
  en_route: "Thợ đang tới",
  arrived: "Đang xử lý",
};

/** "m:ss" under an hour, "h:mm:ss" after; never negative. */
export function formatWait(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** Short ticket code from a request id, e.g. "CH-3F9A1C". */
export function rescueCode(requestId: string): string {
  return `CH-${requestId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** "7,4" — one decimal with a Vietnamese comma. */
export function formatMinutes(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** "08:42:15" in the viewer's clock. */
export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString("vi-VN", { hour12: false });
}
