// Booking workflow rules for the mechanic workspace. Pure and synchronous
// so both the service layer and the UI share exactly one transition table.
import type { MechanicBookingStatus } from "./mechanic.types";

export type MechanicBookingAction =
  | "accept"
  | "decline"
  | "start-travel"
  | "start-work"
  | "complete"
  | "cancel"
  | "mark-no-show";

/** Statuses kept in the transition table, in workflow order. */
export const MECHANIC_BOOKING_STATUSES: MechanicBookingStatus[] = [
  "pending",
  "confirmed",
  "mechanic_assigned",
  "en_route",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

/** Statuses that still need attention from the mechanic. */
const OPEN_STATUSES: MechanicBookingStatus[] = [
  "pending",
  "confirmed",
  "mechanic_assigned",
  "en_route",
  "in_progress",
];

export const STATUS_LABELS: Record<MechanicBookingStatus, string> = {
  pending: "Chờ nhận đơn",
  confirmed: "Đã xác nhận",
  mechanic_assigned: "Đã nhận đơn",
  en_route: "Đang di chuyển",
  in_progress: "Đang sửa xe",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Khách không có mặt",
};

export const ACTION_LABELS: Record<MechanicBookingAction, string> = {
  accept: "Nhận đơn",
  decline: "Từ chối đơn",
  "start-travel": "Bắt đầu di chuyển",
  "start-work": "Bắt đầu sửa xe",
  complete: "Hoàn thành đơn",
  cancel: "Hủy đơn",
  "mark-no-show": "Khách không có mặt",
};

/** Status a mechanic reaches by running one action. */
export const ACTION_TARGET_STATUS: Record<
  MechanicBookingAction,
  MechanicBookingStatus
> = {
  accept: "mechanic_assigned",
  decline: "cancelled",
  "start-travel": "en_route",
  "start-work": "in_progress",
  complete: "completed",
  cancel: "cancelled",
  "mark-no-show": "no_show",
};

/** Statuses each action may start from. A mechanic can never jump steps. */
export const ACTION_ALLOWED_FROM: Record<
  MechanicBookingAction,
  MechanicBookingStatus[]
> = {
  accept: ["pending"],
  decline: ["pending"],
  "start-travel": ["confirmed", "mechanic_assigned"],
  "start-work": ["en_route"],
  complete: ["in_progress"],
  cancel: ["confirmed", "mechanic_assigned", "en_route"],
  "mark-no-show": ["en_route"],
};

export const MECHANIC_BOOKING_ACTIONS = Object.keys(
  ACTION_TARGET_STATUS,
) as MechanicBookingAction[];

export function isMechanicBookingAction(
  value: unknown,
): value is MechanicBookingAction {
  return (
    typeof value === "string" &&
    Object.hasOwn(ACTION_TARGET_STATUS, value as string)
  );
}

export function isMechanicBookingStatus(
  value: unknown,
): value is MechanicBookingStatus {
  return (
    typeof value === "string" &&
    MECHANIC_BOOKING_STATUSES.includes(value as never)
  );
}

/** Parses a raw CQL status; returns null for unknown values. */
export function parseBookingStatus(
  value: string | null | undefined,
): MechanicBookingStatus | null {
  return isMechanicBookingStatus(value) ? value : null;
}

export function isOpenBookingStatus(status: MechanicBookingStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export function isTerminalBookingStatus(
  status: MechanicBookingStatus,
): boolean {
  return !isOpenBookingStatus(status);
}

export function canApplyAction(
  action: MechanicBookingAction,
  from: MechanicBookingStatus,
): boolean {
  return ACTION_ALLOWED_FROM[action].includes(from);
}

/** Actions a mechanic may run from the current status, in button order. */
export function availableActions(
  status: MechanicBookingStatus,
): MechanicBookingAction[] {
  return MECHANIC_BOOKING_ACTIONS.filter((action) =>
    canApplyAction(action, status),
  );
}

export function transitionError(
  action: MechanicBookingAction,
  from: MechanicBookingStatus,
): string {
  const fromLabel = STATUS_LABELS[from];
  const allowed = ACTION_ALLOWED_FROM[action].map(
    (status) => STATUS_LABELS[status],
  );
  return `Không thể "${ACTION_LABELS[action]}" khi đơn đang ở trạng thái "${fromLabel}". Chỉ áp dụng được khi đơn ở trạng thái: ${allowed.join(", ")}.`;
}

// Whether the mechanic becomes unavailable while running this action.
// `null` means availability stays untouched (still free to take more work).
export function availabilityAfterAction(
  action: MechanicBookingAction,
): boolean | null {
  if (action === "start-travel" || action === "start-work") return false;
  if (
    action === "complete" ||
    action === "cancel" ||
    action === "mark-no-show"
  ) {
    return true;
  }
  return null;
}

/** 'YYYY-MM' partition bucket used by bookings_by_status. */
export function monthBucketOf(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
