// Pure rescue dispatch rules shared by the service layer and the UI.
// Rescue is realtime (minutes, not hours): one offer lives 30s, then the
// system re-offers the next nearest mechanic. Dispatchers only handle
// exceptions while auto-dispatch runs immediately in parallel.
export const RESCUE_OFFER_TIMEOUT_MS = 30_000;

export const RESCUE_STATUSES = [
  "open",
  "dispatched",
  "accepted",
  "en_route",
  "arrived",
  "cancelled",
  "completed",
] as const;

export type RescueStatus = (typeof RESCUE_STATUSES)[number];

export type RescueMechanicAction =
  | "accept"
  | "decline"
  | "expire"
  | "depart"
  | "arrive"
  | "complete";

const ACTION_ALLOWED_FROM: Record<RescueMechanicAction, RescueStatus[]> = {
  accept: ["dispatched"],
  decline: ["dispatched"],
  expire: ["dispatched"],
  depart: ["accepted"],
  arrive: ["en_route"],
  // Arrived is the honest path; en_route stays completable so a mechanic
  // who forgot the arrive tap can still close the rescue.
  complete: ["en_route", "arrived"],
};

const ACTION_TARGET_STATUS: Record<RescueMechanicAction, RescueStatus> = {
  accept: "accepted",
  decline: "open",
  expire: "open",
  depart: "en_route",
  arrive: "arrived",
  complete: "completed",
};

export function isRescueStatus(value: unknown): value is RescueStatus {
  return (
    typeof value === "string" &&
    (RESCUE_STATUSES as readonly string[]).includes(value)
  );
}

export function canApplyRescueAction(
  action: RescueMechanicAction,
  from: RescueStatus,
): boolean {
  return ACTION_ALLOWED_FROM[action].includes(from);
}

export function isRescueMechanicAction(
  value: unknown,
): value is RescueMechanicAction {
  return (
    value === "accept" ||
    value === "decline" ||
    value === "expire" ||
    value === "depart" ||
    value === "arrive" ||
    value === "complete"
  );
}

export function rescueActionTarget(action: RescueMechanicAction): RescueStatus {
  return ACTION_TARGET_STATUS[action];
}

// Customer-facing progress ladder for trackers and status steppers.
// open/dispatched collapse into "finding a mechanic"; accepted means the
// offer was taken but the mechanic has not departed yet.
export const RESCUE_PROGRESS_STEPS = [
  "received",
  "finding",
  "en_route",
  "arrived",
  "completed",
] as const;

export type RescueProgressStep = (typeof RESCUE_PROGRESS_STEPS)[number];

export function rescueProgressStep(
  status: string | null,
): RescueProgressStep | "cancelled" {
  switch (status) {
    case "accepted":
    case "dispatched":
      return "finding";
    case "en_route":
      return "en_route";
    case "arrived":
      return "arrived";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "received";
  }
}

// An offer starts at the row updated_at (the dispatch write). Past the
// timeout the assigned mechanic loses the claim and the system re-offers.
// The timeout comes from admin config; the default keeps old callers safe.
export function isRescueOfferExpired(
  dispatchedAt: Date | null | undefined,
  now: Date = new Date(),
  timeoutMs: number = RESCUE_OFFER_TIMEOUT_MS,
): boolean {
  if (!(dispatchedAt instanceof Date) || Number.isNaN(dispatchedAt.getTime())) {
    return false;
  }
  return now.getTime() - dispatchedAt.getTime() >= timeoutMs;
}

export function rescueOfferExpiresAt(
  dispatchedAt: Date,
  timeoutMs: number = RESCUE_OFFER_TIMEOUT_MS,
): string {
  return new Date(dispatchedAt.getTime() + timeoutMs).toISOString();
}
