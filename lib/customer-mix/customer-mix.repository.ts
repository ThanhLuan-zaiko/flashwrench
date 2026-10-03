// Raw CQL for the member-vs-guest counters. No business logic here —
// the service owns ranges, labels and aggregation.
import { scylla } from "@/lib/db/client";
import type {
  MixActorRow,
  MixChannel,
  MixCounterRow,
  MixKind,
} from "./customer-mix.types";

type RawRow = Record<string, unknown>;

function toCount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "bigint") return Number(value);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Best-effort counter bump. Counter updates cannot batch with other
// statements, so each event is its own UPDATE. Throws to the caller,
// which swallows it — counting must never fail a booking or a sign-in.
export async function incrementMixCount(
  day: string,
  kind: MixKind,
  channel: MixChannel,
): Promise<void> {
  await scylla.execute(
    "UPDATE customer_mix_daily SET total = total + 1 WHERE day = ? AND kind = ? AND channel = ?",
    [day, kind, channel],
    { prepare: true },
  );
}

// One partition per day key. Ranges stay small (day = 1, week = 7,
// month <= 31), so a single IN query covers the whole report.
export async function readMixCounts(days: string[]): Promise<MixCounterRow[]> {
  if (days.length === 0) return [];
  const marks = days.map(() => "?").join(", ");
  const rows = await scylla.execute(
    `SELECT day, kind, channel, total FROM customer_mix_daily WHERE day IN (${marks})`,
    days,
    { prepare: true },
  );
  return rows.rows.map((raw: RawRow) => ({
    day: String(raw.day ?? ""),
    kind: String(raw.kind ?? ""),
    channel: String(raw.channel ?? ""),
    total: toCount(raw.total),
  }));
}

// Unique-actor ledger: the (day, kind, channel, actor) primary key
// dedupes repeats, so re-inserting the same identity is a harmless
// upsert. Same best-effort contract as the counter bump — the caller
// swallows failures.
export async function insertMixActor(
  day: string,
  kind: MixKind,
  channel: MixChannel,
  actor: string,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO customer_mix_actors (day, kind, channel, actor) VALUES (?, ?, ?, ?)",
    [day, kind, channel, actor],
    { prepare: true },
  );
}

// Raw actor rows for the report range. The service dedupes across days
// — summing per-day uniques would overcount repeat visitors.
export async function readMixActors(days: string[]): Promise<MixActorRow[]> {
  if (days.length === 0) return [];
  const marks = days.map(() => "?").join(", ");
  const rows = await scylla.execute(
    `SELECT day, kind, channel, actor FROM customer_mix_actors WHERE day IN (${marks})`,
    days,
    { prepare: true },
  );
  return rows.rows.map((raw: RawRow) => ({
    day: String(raw.day ?? ""),
    kind: String(raw.kind ?? ""),
    channel: String(raw.channel ?? ""),
    actor: String(raw.actor ?? ""),
  }));
}
