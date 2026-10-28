// Hydrates guest record refs (from either the email index or the browser
// index) into display summaries. Shared by the OTP lookup and the header's
// "your recent jobs" menu so both surfaces always agree on titles, statuses
// and tracking links. Framework-free: no cookies, no request context.
import { toIso } from "@/lib/mechanic/mechanic.types";
import {
  findBookingRowById,
  listBookingItemRowsByBookingIds,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import {
  GUEST_RECORD_LABELS,
  type GuestRecordSummary,
  type GuestRecordType,
} from "./guest-access.types";

export type GuestRecordRefKey = {
  record_type: GuestRecordType;
  record_id: string;
};

function groupByType(
  refs: readonly GuestRecordRefKey[],
): Map<GuestRecordType, string[]> {
  const grouped = new Map<GuestRecordType, string[]>();
  const seen = new Set<string>();
  for (const ref of refs) {
    // The same job can be indexed twice (retried write, two index rows), so
    // dedupe before any row read.
    const key = `${ref.record_type}:${ref.record_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
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

/**
 * Turns index refs into summaries, skipping records that no longer exist or
 * were claimed into an account. The result is unsorted: each caller orders it
 * for its own surface.
 */
export async function summarizeGuestRecordRefs(
  refs: readonly GuestRecordRefKey[],
): Promise<GuestRecordSummary[]> {
  const grouped = groupByType(refs);
  const [bookings, rescues, orders] = await Promise.all([
    bookingSummaries(grouped.get("booking") ?? []),
    rescueSummaries(grouped.get("rescue") ?? []),
    orderSummaries(grouped.get("order") ?? []),
  ]);
  return [...bookings, ...rescues, ...orders];
}
