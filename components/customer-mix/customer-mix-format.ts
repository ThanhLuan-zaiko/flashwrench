// Display helpers for the member-vs-guest report screens. Pure functions
// and constants — safe to import from server components and metadata.
import type {
  MixKindSlice,
  MixOrderKind,
  MixRange,
} from "@/lib/customer-mix/customer-mix.types";

// Mix counters only exist from the deploy day, so a year range would read
// as one long stretch of zeros — the report stays day/week/month only.
export const MIX_RANGE_TABS: { id: MixRange; label: string }[] = [
  { id: "day", label: "Ngày" },
  { id: "week", label: "Tuần" },
  { id: "month", label: "Tháng" },
];

export function isMixRangeParam(value: string | null): value is MixRange {
  return value === "day" || value === "week" || value === "month";
}

// Same service vocabulary as the revenue source labels.
export const MIX_KIND_LABELS: Record<MixOrderKind, string> = {
  booking: "Đơn sửa xe",
  order: "Đơn linh kiện",
  rescue: "Cứu hộ",
};

export const MEMBER_LABEL = "Thành viên";
export const GUEST_LABEL = "Vãng lai";

/** One text row for a kind slice: "Đơn sửa xe — member share of total". */
export function describeKindSlice(slice: MixKindSlice): {
  label: string;
  counts: string;
  share: string;
} {
  const total = slice.member + slice.guest;
  const percent = total === 0 ? 0 : Math.round((slice.member / total) * 100);
  return {
    label: MIX_KIND_LABELS[slice.kind],
    counts: `${slice.member} ${MEMBER_LABEL.toLowerCase()} · ${slice.guest} ${GUEST_LABEL.toLowerCase()}`,
    share: `${percent}% ${MEMBER_LABEL.toLowerCase()}`,
  };
}
