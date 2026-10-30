import { weekdayOf } from "@/lib/mechanic/mechanic-stats-daily";

export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const WEEKDAY_LONG = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];

/** Axis label per day; the last day reads "Hôm nay". */
export function weekLabels(days: readonly string[]): string[] {
  return days.map((day, index) =>
    index === days.length - 1
      ? "Hôm nay"
      : (WEEKDAY_SHORT[weekdayOf(day)] ?? ""),
  );
}

/** "1,25tr" / "850k" — compact VND with a Vietnamese decimal comma. */
export function compactMoney(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    if (millions >= 10) return `${Math.round(millions)}tr`;
    // Trim trailing zeros of the decimals only: 1.50 → 1,5 and 1.00 → 1.
    const text = millions.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${text.replace(".", ",")}tr`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

/** "+12% so với tuần trước" or a no-baseline hint. */
export function weekChange(current: number, previous: number): string {
  if (previous <= 0) {
    return current > 0 ? "Tuần trước chưa có số liệu" : "Chưa có số liệu";
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? "+" : ""}${percent}% so với tuần trước`;
}
