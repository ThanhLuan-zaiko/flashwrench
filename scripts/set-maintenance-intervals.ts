// Writes the maintenance cadence per service from a JSON file of entries
// shaped like { slug, months, km }. The values are PROPOSED until the shop
// owner confirms them; slugs that do not exist in services_by_slug are
// reported, not created. Idempotent: re-running overwrites the same rows
// with the same values.
// Usage: bun run scripts/set-maintenance-intervals.ts <path-to-intervals.json>
import { readFile } from "node:fs/promises";
import { scylla } from "../lib/db/client";

type IntervalEntry = { slug: string; months: number | null; km: number | null };

function isIntervalEntry(value: unknown): value is IntervalEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.slug === "string" &&
    (entry.months === null || Number.isInteger(entry.months)) &&
    (entry.km === null || Number.isInteger(entry.km))
  );
}

async function loadIntervals(path: string): Promise<IntervalEntry[]> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(parsed) || !parsed.every(isIntervalEntry)) {
    throw new Error(`${path} must be an array of { slug, months, km } entries`);
  }
  return parsed;
}

async function main(): Promise<number> {
  const path = process.argv[2];
  if (!path) {
    console.error(
      "Usage: bun run scripts/set-maintenance-intervals.ts <path-to-intervals.json>",
    );
    return 1;
  }
  let intervals: IntervalEntry[];
  try {
    intervals = await loadIntervals(path);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }

  let written = 0;
  const missing: string[] = [];
  try {
    for (const entry of intervals) {
      const lookup = await scylla.execute(
        "SELECT service_id FROM services_by_slug WHERE slug = ?",
        [entry.slug],
        { prepare: true },
      );
      const serviceId = (
        lookup.rows[0] as unknown as { service_id: unknown } | undefined
      )?.service_id;
      if (!serviceId) {
        missing.push(entry.slug);
        continue;
      }
      await scylla.execute(
        "INSERT INTO maintenance_intervals_by_service (service_id, interval_months, interval_km, updated_at) VALUES (?, ?, ?, toTimestamp(now()))",
        [serviceId, entry.months, entry.km],
        { prepare: true },
      );
      written += 1;
    }
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[maintenance-intervals] wrote ${written}, missing ${missing.length}`,
  );
  if (missing.length > 0) console.log(`missing slugs: ${missing.join(", ")}`);
  return 0;
}

process.exit(await main());
