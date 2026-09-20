// Pure helpers for the customer booking history screen: bucketing,
// labels and chip tones. Shares the domain status vocabulary with the
// mechanic workspace via lib/mechanic/mechanic-status.
import type {
  MechanicBookingStatus,
  MechanicPaymentState,
} from "@/lib/mechanic/mechanic.types";
import { isOpenBookingStatus } from "@/lib/mechanic/mechanic-status";

// Statuses where the mechanic's live pin is meaningful to the customer.
export function isTrackableStatus(status: MechanicBookingStatus): boolean {
  return status === "en_route" || status === "in_progress";
}

export type BookingBuckets<T> = { active: T[]; past: T[] };

// In-flight bookings first (they need watching), finished ones behind.
export function splitBookings<T extends { status: MechanicBookingStatus }>(
  items: T[],
): BookingBuckets<T> {
  const active: T[] = [];
  const past: T[] = [];
  for (const item of items) {
    if (isOpenBookingStatus(item.status)) active.push(item);
    else past.push(item);
  }
  return { active, past };
}

export function paymentStateLabel(state: MechanicPaymentState): string {
  if (state === "paid") return "Đã thanh toán";
  if (state === "refunded") return "Đã hoàn tiền";
  return "Chưa thanh toán";
}

const STATUS_CHIP_TONE: Record<MechanicBookingStatus, string> = {
  pending:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  confirmed:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  mechanic_assigned:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  en_route:
    "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900",
  in_progress:
    "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900",
  completed:
    "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900",
  cancelled:
    "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500",
  no_show:
    "border-zinc-300 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500",
};

export function statusChipTone(status: MechanicBookingStatus): string {
  return STATUS_CHIP_TONE[status];
}

// Heading shown over the live map so the customer knows whose pin moves.
export function trackingHeadline(status: MechanicBookingStatus): string {
  return status === "en_route" ? "Thợ đang trên đường tới" : "Thợ đang sửa xe";
}
