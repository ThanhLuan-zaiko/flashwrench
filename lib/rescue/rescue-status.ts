// Pure rescue dispatch rules shared by the service layer and the UI.
// Rescue is realtime (minutes, not hours): one offer lives 30s, then the
// system re-offers the next nearest mechanic. Dispatchers only handle
// exceptions while auto-dispatch runs immediately in parallel.
export const RESCUE_OFFER_TIMEOUT_MS = 30_000;

export const RESCUE_STATUSES = [
  "open",
  "dispatched",
  "accepted",
  "cancelled",
  "completed",
] as const;

export type RescueStatus = (typeof RESCUE_STATUSES)[number];

export type RescueMechanicAction = "accept" | "decline" | "expire";

const ACTION_ALLOWED_FROM: Record<RescueMechanicAction, RescueStatus[]> = {
  accept: ["dispatched"],
  decline: ["dispatched"],
  expire: ["dispatched"],
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
  return value === "accept" || value === "decline" || value === "expire";
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
