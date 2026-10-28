// Pure helpers for the header's guest jobs menu, kept framework-free so
// they are unit-testable without a DOM.
import type { GuestRecordSummary } from "@/lib/guest-access/guest-access.types";

/** Rows shown in the dropdown; the rest live behind the /lookup link. */
export const GUEST_MENU_VISIBLE = 5;

/** OTP lookup: the fallback for anything without a public tracking page. */
export const GUEST_LOOKUP_HREF = "/lookup";

// Statuses after which nothing more happens to a job. Everything else is
// still moving and earns a spot in the badge count.
const FINISHED_STATUSES = new Set([
  "completed",
  "cancelled",
  "no_show",
  "resolved",
  "expired",
  "delivered",
  "returned",
]);

export function isActiveGuestRecord(record: GuestRecordSummary): boolean {
  return !FINISHED_STATUSES.has(record.status);
}

export function countActiveGuestRecords(
  records: readonly GuestRecordSummary[],
): number {
  return records.filter(isActiveGuestRecord).length;
}

/** Where a row links: live tracking when it exists, else the OTP lookup. */
export function guestRecordHref(record: GuestRecordSummary): string {
  return record.trackHref ?? GUEST_LOOKUP_HREF;
}

export function guestMenuLabel(activeCount: number, open: boolean): string {
  if (open) return "Đóng danh sách đơn của bạn";
  return activeCount > 0
    ? `Đơn của bạn, ${activeCount} đơn đang xử lý`
    : "Đơn của bạn";
}
