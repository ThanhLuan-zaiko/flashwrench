// Pure workflow rules for the dispatch board. Mirrors the server checks in
// lib/dispatch/dispatch.service.ts so the UI only offers what the API will
// accept; the server remains the source of truth on conflicts.
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";

export type DispatchBoardAction = "assign" | "confirm" | "cancel";

export const DISPATCH_ACTION_LABELS: Record<DispatchBoardAction, string> = {
  assign: "Phân công thợ",
  confirm: "Xác nhận đơn",
  cancel: "Hủy đơn",
};

// Statuses where the dispatcher may still touch the booking: assign a
// mechanic or cancel it. Everything further along belongs to the mechanic.
const DISPATCH_TOUCHABLE = new Set<MechanicBookingStatus>([
  "pending",
  "confirmed",
  "mechanic_assigned",
]);

export function canDispatchTouch(status: MechanicBookingStatus): boolean {
  return DISPATCH_TOUCHABLE.has(status);
}

// Actions for one booking row, in button order. Assign comes first because
// it is the dispatcher's main job; confirm only exists while no mechanic
// holds the booking; cancel always trails last.
export function dispatchActionsFor(
  status: MechanicBookingStatus,
  hasMechanic: boolean,
): DispatchBoardAction[] {
  if (!DISPATCH_TOUCHABLE.has(status)) return [];
  const actions: DispatchBoardAction[] = ["assign"];
  if (status === "pending" && !hasMechanic) actions.push("confirm");
  actions.push("cancel");
  return actions;
}

export function assignActionLabel(hasMechanic: boolean): string {
  return hasMechanic ? "Đổi thợ phụ trách" : DISPATCH_ACTION_LABELS.assign;
}
