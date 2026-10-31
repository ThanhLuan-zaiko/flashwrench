// Server-side rescue offer sweep. The mechanic's browser fires the expire
// call only while its inbox is open, so an offer held by a closed tab would
// stall the rescue until a dispatcher noticed. The sweep expires overdue
// offers and re-offers them. expireRescueOffer is a CAS, so overlapping
// sweeps and gateway replicas cannot double-expire an offer.
import {
  autoDispatchRescue,
  expireRescueOffer,
} from "./rescue-dispatch.service";
import { listRescueRefsByStatus } from "./rescue-workflow.repository";

export const RESCUE_SWEEP_LIMIT = 50;

// Expires every dispatched offer past its lifetime. Returns how many were
// expired; a failing row is skipped and retried on the next tick.
export async function sweepExpiredRescueOffers(
  now: Date = new Date(),
): Promise<number> {
  const page = await listRescueRefsByStatus(
    "dispatched",
    RESCUE_SWEEP_LIMIT,
    null,
  );
  let expired = 0;
  for (const ref of page.rows) {
    try {
      const outcome = await expireRescueOffer(ref.request_id, now);
      if (outcome.expired) expired += 1;
    } catch {
      // Best-effort per row: one bad rescue must not stall the sweep.
    }
  }
  return expired;
}

// Offers open rescues to the nearest free mechanic. Runs when a mechanic
// comes online, the same way unassigned bookings are swept, so a rescue
// filed while everyone was busy does not wait for a dispatcher.
export async function redispatchOpenRescues(
  limit: number = RESCUE_SWEEP_LIMIT,
): Promise<number> {
  const page = await listRescueRefsByStatus("open", limit, null);
  let assigned = 0;
  for (const ref of page.rows) {
    try {
      if (await autoDispatchRescue(ref.request_id)) assigned += 1;
    } catch {
      // Best-effort per row, same as the expiry sweep.
    }
  }
  return assigned;
}
