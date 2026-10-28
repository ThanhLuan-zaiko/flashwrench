// Route-side glue for the browser-keyed guest history: after an anonymous
// booking, rescue request or checkout persists, tie it to this browser's
// fw_gid token (minting one when the visitor has none yet) and refresh the
// cookie on the outgoing response. Never throws: the job is already saved,
// so a cookie or index hiccup must not turn a 201 into a 500.
import type { NextResponse } from "next/server";
import {
  GUEST_COOKIE,
  guestCookieOptions,
  newGuestId,
  readGuestId,
} from "@/lib/auth/guest-session";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";
import { rememberGuestRecord } from "./guest-records.service";

export async function linkGuestRecordToBrowser<T extends NextResponse>(
  response: T,
  recordType: GuestRecordType,
  recordId: string,
): Promise<T> {
  try {
    const guestId = (await readGuestId()) ?? newGuestId();
    await rememberGuestRecord(guestId, recordType, recordId);
    // Re-set even when the cookie already existed: every new job extends
    // the window in which this browser can find its history again.
    response.cookies.set(GUEST_COOKIE, guestId, guestCookieOptions());
  } catch {
    // Best effort only — the emailed link and /lookup still recover the job.
  }
  return response;
}
