// Rescue inbox events delivered on `user:{mechanicId}` when auto-dispatch
// offers a 30s rescue. Narrow on purpose: the shell must never toast or
// refetch on an event it cannot name.
export const RESCUE_ASSIGNED_EVENT_KIND = "rescue-assigned";

export type RescueInboxEvent = {
  kind: typeof RESCUE_ASSIGNED_EVENT_KIND;
  rescueId: string;
  status: string;
};

// Rescue offers land on the same mechanic inbox topic as bookings. Lock
// notices and booking notices share the topic and are ignored here.
export function parseRescueInboxEvent(
  payload: unknown,
): RescueInboxEvent | null {
  if (typeof payload !== "object" || payload === null) return null;
  const body = payload as Record<string, unknown>;
  if (body.kind !== RESCUE_ASSIGNED_EVENT_KIND) return null;
  const rescueId = body.rescueId;
  const status = body.status;
  if (typeof rescueId !== "string" || rescueId.length === 0) return null;
  if (typeof status !== "string" || status.length === 0) return null;
  return { kind: RESCUE_ASSIGNED_EVENT_KIND, rescueId, status };
}
