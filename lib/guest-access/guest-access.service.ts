// Read side of the guest-access flow. Turns the email-keyed index into a
// display list, and is the single place that decides whether a verified
// visitor may read one specific record.
import { cookies } from "next/headers";
import {
  GUEST_ACCESS_COOKIE,
  parseGuestAccessToken,
} from "@/lib/auth/guest-access";
import { maskEmail } from "@/lib/mail/otp-email";
import { isUuid } from "@/lib/validation";
import { listGuestRecordRefsByEmail } from "./guest-access.repository";
import type {
  GuestAccessResult,
  GuestRecordList,
  GuestRecordType,
} from "./guest-access.types";
import { summarizeGuestRecordRefs } from "./guest-record-summaries";

const NOT_SIGNED_IN = "Phiên tra cứu đã hết hạn. Vui lòng xác minh email lại.";

/** The verified address behind the guest-access cookie, or null. */
export async function readGuestAccessEmail(): Promise<string | null> {
  const store = await cookies();
  return (
    parseGuestAccessToken(store.get(GUEST_ACCESS_COOKIE)?.value)?.email ?? null
  );
}

export async function listGuestRecords(
  email: string,
): Promise<GuestAccessResult<GuestRecordList>> {
  if (!email) {
    return { ok: false, status: 401, errors: { form: NOT_SIGNED_IN } };
  }
  const refs = await listGuestRecordRefsByEmail(email);
  const summaries = await summarizeGuestRecordRefs(refs);

  // Index order is created_at DESC per type; merge so the newest job of any
  // kind leads the list.
  const records = summaries.sort((a, b) => {
    const left = a.scheduledAt ?? a.createdAt ?? "";
    const right = b.scheduledAt ?? b.createdAt ?? "";
    return right.localeCompare(left);
  });

  return {
    ok: true,
    data: { maskedEmail: maskEmail(email), records },
  };
}

/**
 * Ownership guard for the invoice endpoints. A verified address may read a
 * record only when the index still lists it AND the record itself is still
 * unclaimed — otherwise a stale index row would outlive the claim.
 */
export async function requireGuestRecord(
  email: string,
  type: GuestRecordType,
  id: string,
): Promise<GuestAccessResult<true>> {
  if (!email) {
    return { ok: false, status: 401, errors: { form: NOT_SIGNED_IN } };
  }
  if (!isUuid(id)) {
    return { ok: false, status: 400, errors: { form: "Mã không hợp lệ." } };
  }
  const refs = await listGuestRecordRefsByEmail(email);
  if (!refs.some((ref) => ref.record_type === type && ref.record_id === id)) {
    // Same shape as a miss for a wrong id and a wrong owner: never confirm
    // that a record exists under an address the visitor does not control.
    return {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy dữ liệu này trong tài khoản của bạn." },
    };
  }
  return { ok: true, data: true };
}
