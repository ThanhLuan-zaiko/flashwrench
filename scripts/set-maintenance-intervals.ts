// Writes the maintenance cadence per service from scripts/maintenance-intervals.json.
// The file holds PROPOSED values until the shop owner confirms them; slugs
// that do not exist in services_by_slug are reported, not created.
// Idempotent: re-running overwrites the same rows with the same values.
// Usage: bun run scripts/set-maintenance-intervals.ts
import { scylla } from "../lib/db/client";
import intervals from "./maintenance-intervals.json";

type IntervalEntry = { slug: string; months: number | null; km: number | null };

async function main(): Promise<number> {
  let written = 0;
  const missing: string[] = [];
  try {
    for (const entry of intervals as IntervalEntry[]) {
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
