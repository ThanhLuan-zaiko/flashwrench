// Browser-keyed guest history. Every anonymous booking, rescue request or
// parts order is tied to the fw_gid cookie that filed it, so a second tab of
// the same browser can list it without an OTP round-trip. The cookie is an
// unguessable UUID (same capability model as the public tracking links) and
// this surface is read-only, so holding it grants nothing the tracking link
// did not already grant.
import { GUEST_COOKIE_TTL_SECONDS } from "@/lib/auth/guest-session.constants";
import {
  type GuestRecordSummary,
  type GuestRecordType,
  isGuestRecordType,
} from "@/lib/guest-access/guest-access.types";
import { summarizeGuestRecordRefs } from "@/lib/guest-access/guest-record-summaries";
import { isUuid } from "@/lib/validation";
import {
  listGuestRecordRefsByGid,
  putGuestRecordRefByGid,
} from "./guest-records.repository";

/** How many recent jobs one browser partition is read for. */
export const GUEST_RECENT_LIMIT = 10;

/**
 * Ties a freshly created anonymous job to the browser that filed it.
 * Best-effort by design: the job already persisted, so an index outage must
 * never fail the request — the visitor can still recover it through the
 * emailed link or the OTP lookup. Returns whether the row was written.
 */
export async function rememberGuestRecord(
  guestId: string,
  recordType: GuestRecordType,
  recordId: string,
  now: Date = new Date(),
): Promise<boolean> {
  if (!isUuid(guestId) || !isUuid(recordId)) return false;
  if (!isGuestRecordType(recordType)) return false;
  try {
    await putGuestRecordRefByGid({
      guestId,
      recordType,
      recordId,
      createdAt: now,
      // Rows live exactly as long as the cookie that can read them.
      ttlSeconds: GUEST_COOKIE_TTL_SECONDS,
    });
    return true;
  } catch {
    return false;
  }
}

function newestFirst(a: GuestRecordSummary, b: GuestRecordSummary): number {
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

/**
 * The browser's recent anonymous jobs, newest filed first. A missing or
 * malformed token simply has no history: no storage read happens.
 */
export async function listRecentGuestRecords(
  guestId: string | null,
): Promise<GuestRecordSummary[]> {
  if (!guestId || !isUuid(guestId)) return [];
  const refs = await listGuestRecordRefsByGid(guestId, GUEST_RECENT_LIMIT);
  if (refs.length === 0) return [];
  const summaries = await summarizeGuestRecordRefs(refs);
  return summaries.sort(newestFirst);
}
