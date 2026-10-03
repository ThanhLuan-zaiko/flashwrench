// Member-vs-guest aggregation. Writes are fire-and-forget counters —
// a counting failure must never fail the booking or sign-in that
// triggered it. Reads fan out over at most 31 day partitions.
import { dayKey } from "@/lib/mechanic/mechanic-period";
import {
  normalizeRevenueAnchor,
  REVENUE_TIME_ZONE,
  rangeDayKeys,
  rangeLabel,
  seriesBuckets,
} from "@/lib/revenue/revenue-period";
import {
  incrementMixCount,
  insertMixActor,
  readMixActors,
  readMixCounts,
} from "./customer-mix.repository";
import {
  type CustomerMixReport,
  isMixRange,
  MIX_KINDS,
  type MixActorRow,
  type MixChannel,
  type MixCounterRow,
  type MixKind,
  type MixLoginPoint,
  type MixOrderKind,
  type MixOrderPoint,
  type MixRange,
  type MixReportResult,
} from "./customer-mix.types";

export type { MixChannel, MixKind, MixRange };

const ORDER_KINDS: readonly MixOrderKind[] = ["booking", "order", "rescue"];

function isKnownKind(value: string): value is MixKind {
  return (MIX_KINDS as readonly string[]).includes(value);
}

function isKnownChannel(value: string): value is MixChannel {
  return value === "member" || value === "guest";
}

// Record one event against today's counters. Never rejects: callers
// fire it after the domain write already succeeded (or lazily import it
// so the auth bundle stays lean) and counting stays best-effort. When
// the caller can name the actor (user id for members, normalized email
// for guests) the event also lands in the unique-actor ledger — keyed
// u:/e: so a member id and an email can never collide.
export async function recordMixEvent(
  kind: MixKind,
  channel: MixChannel,
  options?: { at?: Date; actor?: string },
): Promise<void> {
  const day = dayKey(options?.at ?? new Date(), REVENUE_TIME_ZONE);
  try {
    await incrementMixCount(day, kind, channel);
  } catch {
    // Counting must never fail the booking or sign-in.
  }
  const actor = options?.actor;
  if (!actor) return;
  try {
    await insertMixActor(
      day,
      kind,
      channel,
      `${channel === "member" ? "u" : "e"}:${actor}`,
    );
  } catch {
    // Same best-effort contract as the counter bump.
  }
}

type CellTotals = Record<MixKind, Record<MixChannel, number>>;

function emptyTotals(): CellTotals {
  return {
    booking: { member: 0, guest: 0 },
    order: { member: 0, guest: 0 },
    rescue: { member: 0, guest: 0 },
    login: { member: 0, guest: 0 },
    signup: { member: 0, guest: 0 },
  };
}

function foldRows(rows: MixCounterRow[]): Map<string, CellTotals> {
  const byDay = new Map<string, CellTotals>();
  for (const row of rows) {
    if (!isKnownKind(row.kind) || !isKnownChannel(row.channel)) continue;
    let cell = byDay.get(row.day);
    if (!cell) {
      cell = emptyTotals();
      byDay.set(row.day, cell);
    }
    cell[row.kind][row.channel] += Math.max(0, row.total);
  }
  return byDay;
}

// Unique identities must be deduped across the whole range — a member
// signing in every day is ONE customer in a week report, not seven.
// Buyer sets union the three order kinds; signup rows are skipped
// because a fresh account is not a purchase.
function foldActors(rows: MixActorRow[]): {
  buyerSets: Record<MixChannel, Set<string>>;
  loginSets: Record<MixChannel, Set<string>>;
} {
  const buyerSets = { member: new Set<string>(), guest: new Set<string>() };
  const loginSets = { member: new Set<string>(), guest: new Set<string>() };
  for (const row of rows) {
    if (!isKnownKind(row.kind) || !isKnownChannel(row.channel)) continue;
    if (row.kind === "login") loginSets[row.channel].add(row.actor);
    else if (row.kind !== "signup") buyerSets[row.channel].add(row.actor);
  }
  return { buyerSets, loginSets };
}

export async function getCustomerMixReport(
  raw: { range: unknown; anchor: unknown },
  now: Date = new Date(),
): Promise<MixReportResult> {
  if (!isMixRange(raw.range)) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Khoảng báo cáo không hợp lệ." },
    };
  }
  const range: MixRange = raw.range;
  const anchor = normalizeRevenueAnchor(range, raw.anchor, now);
  if (!anchor) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Mốc thời gian không hợp lệ." },
    };
  }
  const days = rangeDayKeys(range, anchor);
  const [rows, actorRows] = await Promise.all([
    readMixCounts(days),
    readMixActors(days),
  ]);
  return {
    ok: true,
    data: buildCustomerMixReport(range, anchor, days, rows, actorRows),
  };
}

// Pure aggregation over counter rows: unit-testable without a database.
// Unknown kinds/channels are ignored so a future kind never breaks
// the report.
export function buildCustomerMixReport(
  range: MixRange,
  anchor: string,
  days: string[],
  rows: MixCounterRow[],
  actorRows: MixActorRow[] = [],
): CustomerMixReport {
  const byDay = foldRows(rows);
  const { buyerSets, loginSets } = foldActors(actorRows);

  // Day ranges have hourly series in revenue, but mix counters are
  // daily — a single bucket keeps the chart truthful.
  const buckets =
    range === "day"
      ? [{ key: anchor, label: rangeLabel(range, anchor) }]
      : seriesBuckets(range, anchor);

  const orderSeries: MixOrderPoint[] = buckets.map((bucket) => {
    const cell = byDay.get(bucket.key);
    const member = ORDER_KINDS.reduce(
      (sum, kind) => sum + (cell?.[kind].member ?? 0),
      0,
    );
    const guest = ORDER_KINDS.reduce(
      (sum, kind) => sum + (cell?.[kind].guest ?? 0),
      0,
    );
    return { key: bucket.key, label: bucket.label, member, guest };
  });

  const loginSeries: MixLoginPoint[] = buckets.map((bucket) => {
    const cell = byDay.get(bucket.key);
    return {
      key: bucket.key,
      label: bucket.label,
      member: cell?.login.member ?? 0,
      guest: cell?.login.guest ?? 0,
    };
  });

  const byKind = ORDER_KINDS.map((kind) => ({
    kind,
    member: days.reduce(
      (sum, day) => sum + (byDay.get(day)?.[kind].member ?? 0),
      0,
    ),
    guest: days.reduce(
      (sum, day) => sum + (byDay.get(day)?.[kind].guest ?? 0),
      0,
    ),
  }));

  const memberOrders = byKind.reduce((sum, slice) => sum + slice.member, 0);
  const guestOrders = byKind.reduce((sum, slice) => sum + slice.guest, 0);
  const memberLogins = days.reduce(
    (sum, day) => sum + (byDay.get(day)?.login.member ?? 0),
    0,
  );
  const guestLogins = days.reduce(
    (sum, day) => sum + (byDay.get(day)?.login.guest ?? 0),
    0,
  );
  const memberSignups = days.reduce(
    (sum, day) => sum + (byDay.get(day)?.signup.member ?? 0),
    0,
  );
  const orderTotal = memberOrders + guestOrders;

  const data: CustomerMixReport = {
    range,
    anchor,
    label: rangeLabel(range, anchor),
    timeZone: REVENUE_TIME_ZONE,
    orderSeries,
    loginSeries,
    byKind,
    totals: {
      memberOrders,
      guestOrders,
      memberLogins,
      guestLogins,
      memberSignups,
      memberShare: orderTotal === 0 ? null : memberOrders / orderTotal,
      memberBuyers: buyerSets.member.size,
      guestBuyers: buyerSets.guest.size,
      memberLoginActors: loginSets.member.size,
      guestLoginActors: loginSets.guest.size,
    },
  };
  return data;
}

// Admin and dispatch read the same counters — the split exists so each
// workspace keeps its own role guard, like the revenue endpoints.
export async function getAdminCustomerMix(
  raw: { range: unknown; anchor: unknown },
  now?: Date,
): Promise<MixReportResult> {
  return getCustomerMixReport(raw, now);
}

export async function getDispatchCustomerMix(
  raw: { range: unknown; anchor: unknown },
  now?: Date,
): Promise<MixReportResult> {
  return getCustomerMixReport(raw, now);
}
