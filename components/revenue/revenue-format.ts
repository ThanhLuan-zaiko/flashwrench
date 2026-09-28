// Display helpers for the revenue screens. Pure functions — unit tests
// cover anchor math and formatting without rendering.

import type { RevenueSlice } from "@/lib/revenue/revenue.types";
import type { RevenueRange } from "@/lib/revenue/revenue-period";

export const REVENUE_RANGE_TABS: { id: RevenueRange; label: string }[] = [
  { id: "day", label: "Ngày" },
  { id: "week", label: "Tuần" },
  { id: "month", label: "Tháng" },
  { id: "year", label: "Năm" },
];

export function isRevenueRangeParam(
  value: string | null,
): value is RevenueRange {
  return (
    value === "day" || value === "week" || value === "month" || value === "year"
  );
}

export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

/** Signed percent delta vs the previous range, e.g. "+12%" / "−5%". */
export function formatDelta(percent: number | null, delta: number): string {
  if (percent === null) {
    return delta > 0
      ? "Kỳ trước không có doanh thu"
      : "Không đổi so với kỳ trước";
  }
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent}% so với kỳ trước`;
}

export function formatPercent(amount: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((amount / total) * 100)}%`;
}

const SOURCE_LABELS: Record<string, string> = {
  booking: "Đơn sửa xe",
  order: "Đơn linh kiện",
  emergency: "Cứu hộ",
};

const METHOD_LABELS: Record<string, string> = {
  cod: "Tiền mặt",
  counter: "Tại quầy",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  vnpay: "VNPay",
  zalopay: "ZaloPay",
  card: "Thẻ",
};

export function sliceLabel(kind: "source" | "method", key: string): string {
  const map = kind === "source" ? SOURCE_LABELS : METHOD_LABELS;
  return map[key] ?? key;
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayAnchor(): string {
  return toDayKey(new Date());
}

/** Steps the anchor back/forward by one whole range. */
export function shiftAnchor(
  range: RevenueRange,
  anchor: string,
  direction: 1 | -1,
): string {
  const [y, m, d] = anchor.split("-").map((part) => Number(part));
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (range === "day") date.setDate(date.getDate() + direction);
  else if (range === "week") date.setDate(date.getDate() + direction * 7);
  else if (range === "month") date.setMonth(date.getMonth() + direction);
  else date.setFullYear(date.getFullYear() + direction);
  return toDayKey(date);
}

/** Sorted, largest-first slice list with human labels applied. */
export function describeSlice(
  kind: "source" | "method",
  slice: RevenueSlice,
  total: number,
): { label: string; value: string; share: string; count: string } {
  return {
    label: sliceLabel(kind, slice.key),
    value: formatVnd(slice.amount),
    share: formatPercent(slice.amount, total),
    count: `${slice.count} giao dịch`,
  };
}
