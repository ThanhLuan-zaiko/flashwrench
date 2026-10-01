// Read side of the guest-access flow. Turns the email-keyed index into a
// display list, and is the single place that decides whether a verified
// visitor may read one specific record.
import { cookies } from "next/headers";
import {
  GUEST_ACCESS_COOKIE,
  parseGuestAccessToken,
} from "@/lib/auth/guest-access";
import { maskEmail } from "@/lib/mail/otp-email";
import { toIso } from "@/lib/mechanic/mechanic.types";
import {
  findBookingRowById,
  listBookingItemRowsByBookingIds,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import { isUuid } from "@/lib/validation";
import {
  type GuestRecordRef,
  listGuestRecordRefsByEmail,
} from "./guest-access.repository";
import {
  GUEST_RECORD_LABELS,
  type GuestAccessResult,
  type GuestRecordList,
  type GuestRecordSummary,
  type GuestRecordType,
} from "./guest-access.types";

const NOT_SIGNED_IN = "Phiên tra cứu đã hết hạn. Vui lòng xác minh email lại.";

/** The verified address behind the guest-access cookie, or null. */
export async function readGuestAccessEmail(): Promise<string | null> {
  const store = await cookies();
  return (
    parseGuestAccessToken(store.get(GUEST_ACCESS_COOKIE)?.value)?.email ?? null
  );
}

function groupByType(refs: GuestRecordRef[]): Map<GuestRecordType, string[]> {
  const grouped = new Map<GuestRecordType, string[]>();
  for (const ref of refs) {
    const bucket = grouped.get(ref.record_type);
    if (bucket) bucket.push(ref.record_id);
    else grouped.set(ref.record_type, [ref.record_id]);
  }
  return grouped;
}

async function bookingSummaries(ids: string[]): Promise<GuestRecordSummary[]> {
  if (ids.length === 0) return [];
  const itemGroups = new Map(
    (await listBookingItemRowsByBookingIds(ids)).map((item) => [
      item.booking_id,
      item,
    ]),
  );
  const out: GuestRecordSummary[] = [];
  for (const id of ids) {
    const row = await findBookingRowById(id);
    // Claimed into an account: the index row is stale, so drop it here.
    if (!row || row.customer_id) continue;
    const item = itemGroups.get(id);
    out.push({
      type: "booking",
      id,
      title: item?.service_name ?? GUEST_RECORD_LABELS.booking,
      status: row.status ?? "pending",
      createdAt: toIso(row.created_at),
      scheduledAt: toIso(row.scheduled_at),
      total: row.total ?? null,
      mechanicName: row.mechanic_name ?? null,
      trackHref: `/track/booking/${id}`,
    });
  }
  return out;
}

async function rescueSummaries(ids: string[]): Promise<GuestRecordSummary[]> {
  const out: GuestRecordSummary[] = [];
  for (const id of ids) {
    const row = await findRescueRowById(id);
    if (!row || row.customer_id) continue;
    out.push({
      type: "rescue",
      id,
      title: row.issue_type ?? GUEST_RECORD_LABELS.rescue,
      status: row.status ?? "open",
      createdAt: toIso(row.created_at),
      scheduledAt: null,
      total: row.final_price ?? row.price_estimate ?? null,
      mechanicName: row.assigned_mechanic_name ?? null,
      // No public rescue tracking page exists yet, so there is no link to give.
      trackHref: null,
    });
  }
  return out;
}

async function orderSummaries(ids: string[]): Promise<GuestRecordSummary[]> {
  const out: GuestRecordSummary[] = [];
  for (const id of ids) {
    const row = await findOrderRowById(id);
    if (!row || row.customer_id) continue;
    out.push({
      type: "order",
      id,
      title: GUEST_RECORD_LABELS.order,
      status: row.status ?? "pending",
      createdAt: toIso(row.created_at),
      scheduledAt: null,
      total: row.total ?? null,
      mechanicName: null,
      trackHref: `/track/order/${id}`,
    });
  }
  return out;
}

export async function listGuestRecords(
  email: string,
): Promise<GuestAccessResult<GuestRecordList>> {
  if (!email) {
    return { ok: false, status: 401, errors: { form: NOT_SIGNED_IN } };
  }
  const refs = await listGuestRecordRefsByEmail(email);
  const grouped = groupByType(refs);

  const [bookings, rescues, orders] = await Promise.all([
    bookingSummaries(grouped.get("booking") ?? []),
    rescueSummaries(grouped.get("rescue") ?? []),
    orderSummaries(grouped.get("order") ?? []),
  ]);

  // Index order is created_at DESC per type; merge so the newest job of any
  // kind leads the list.
  const records = [...bookings, ...rescues, ...orders].sort((a, b) => {
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
