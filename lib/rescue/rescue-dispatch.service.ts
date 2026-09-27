// Automatic rescue dispatch: offer an open rescue to the nearest
// eligible mechanic immediately, so dispatchers only monitor in parallel
// and handle exceptions. Always fails soft: a dispatch error must never
// break the rescue creation that already persisted.
import { isMechanicEligible } from "@/lib/mechanic/mechanic-assignment.service";
import { listAvailableMechanics } from "@/lib/mechanic/mechanic-directory.service";
import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { isRescueOfferExpired, rescueOfferExpiresAt } from "./rescue-status";
import {
  claimRescueTransition,
  findRescueRowById,
  listRescueHistoryRows,
  projectRescueTransition,
  type RescueRow,
} from "./rescue-workflow.repository";

export const RESCUE_DISPATCH_CANDIDATE_LIMIT = 50;
const DECLINE_SCAN_LIMIT = 50;

// Scheduler has no user account, so its writes carry the nil UUID.
const SYSTEM_ACTOR_ID = "00000000-0000-0000-0000-000000000000";
const AUTO_DISPATCH_NOTE = "Hệ thống tự điều phối thợ gần nhất.";
const EXPIRE_NOTE = "Hết 30 giây chờ xác nhận, tự động chuyển thợ kế tiếp.";

export type RescueDispatchOutcome = {
  mechanicId: string;
  mechanicName: string;
  offerExpiresAt: string;
};

export type RescueExpireOutcome = {
  expired: boolean;
  reassigned?: RescueDispatchOutcome | null;
};

// Mechanics who refused or timed out: an unassign writes a history row
// landing on open with the mechanic as the actor. Dispatcher assigns land
// on dispatched with a dispatcher id that never appears in the mechanic
// directory, so folding them in is harmless.
async function declinedMechanicIds(requestId: string): Promise<Set<string>> {
  const rows = await listRescueHistoryRows(requestId, DECLINE_SCAN_LIMIT);
  const declined = new Set<string>();
  for (const row of rows) {
    if (row.new_status === "open" && row.changed_by) {
      declined.add(row.changed_by);
    }
  }
  return declined;
}

function dispatchOrigin(row: RescueRow): { lat?: number; lng?: number } {
  if (
    typeof row.address_lat === "number" &&
    typeof row.address_lng === "number"
  ) {
    return { lat: row.address_lat, lng: row.address_lng };
  }
  return {};
}

// Offer the rescue to the nearest eligible mechanic. Without a map pin
// the directory falls back to rating order, which broadcasts to every
// online mechanic regardless of zone.
export async function autoDispatchRescue(
  requestId: string,
  options?: { excludeMechanicIds?: Iterable<string> },
): Promise<RescueDispatchOutcome | null> {
  const row = await findRescueRowById(requestId);
  if (!row || row.status !== "open" || row.assigned_mechanic_id !== null) {
    return null;
  }

  const excluded = await declinedMechanicIds(requestId);
  for (const id of options?.excludeMechanicIds ?? []) excluded.add(id);

  const candidates = await listAvailableMechanics({
    ...dispatchOrigin(row),
    limit: RESCUE_DISPATCH_CANDIDATE_LIMIT,
  });
  if (!candidates.ok) return null;

  for (const candidate of candidates.data) {
    if (excluded.has(candidate.id)) continue;
    if (!(await isMechanicEligible(candidate.id))) continue;

    const at = new Date();
    const applied = await claimRescueTransition({
      before: row,
      status: "dispatched",
      mechanicId: candidate.id,
      mechanicName: candidate.displayName,
      actorId: SYSTEM_ACTOR_ID,
      note: AUTO_DISPATCH_NOTE,
      at,
    });
    // Lost the claim: a dispatcher or another pass just touched the row.
    if (!applied) return null;
    await projectRescueTransition({
      before: row,
      status: "dispatched",
      mechanicId: candidate.id,
      mechanicName: candidate.displayName,
      actorId: SYSTEM_ACTOR_ID,
      note: AUTO_DISPATCH_NOTE,
      at,
    });
    await publishRescueChange(
      "rescue-assigned",
      requestId,
      "dispatched",
      row.customer_id,
      [candidate.id],
      row.zone_id,
    );
    return {
      mechanicId: candidate.id,
      mechanicName: candidate.displayName,
      offerExpiresAt: rescueOfferExpiresAt(at),
    };
  }
  return null;
}

export async function redispatchAfterDecline(
  requestId: string,
  declinedBy: string,
): Promise<void> {
  try {
    await autoDispatchRescue(requestId, {
      excludeMechanicIds: [declinedBy],
    });
  } catch {
    // Best-effort: the dispatcher queue still shows the rescue.
  }
}

// Called 30s after the offer by the mechanic timer, the dispatcher
// monitor, or a cron sweep. Only the still-holding mechanic is expired.
// force skips the 30s check for a dispatcher "expire now" override.
export async function expireRescueOffer(
  requestId: string,
  now: Date = new Date(),
  options?: { force?: boolean },
): Promise<RescueExpireOutcome> {
  const row = await findRescueRowById(requestId);
  if (
    !row ||
    row.status !== "dispatched" ||
    !row.assigned_mechanic_id ||
    (!options?.force && !isRescueOfferExpired(row.updated_at, now))
  ) {
    return { expired: false };
  }

  const expiredMechanic = row.assigned_mechanic_id;
  const applied = await claimRescueTransition({
    before: row,
    status: "open",
    mechanicId: null,
    mechanicName: null,
    actorId: SYSTEM_ACTOR_ID,
    note: EXPIRE_NOTE,
    at: now,
  });
  if (!applied) return { expired: false };
  await projectRescueTransition({
    before: row,
    status: "open",
    mechanicId: null,
    mechanicName: null,
    actorId: expiredMechanic,
    note: EXPIRE_NOTE,
    at: now,
  });

  const reassigned = await autoDispatchRescue(requestId, {
    excludeMechanicIds: [expiredMechanic],
  });
  await publishRescueChange(
    "rescue-updated",
    requestId,
    reassigned ? "dispatched" : "open",
    row.customer_id,
    [expiredMechanic, reassigned?.mechanicId ?? null],
    row.zone_id,
  );
  return { expired: true, reassigned };
}
