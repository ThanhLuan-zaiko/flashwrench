// One-off: plan due dates for vehicles whose newest booking visit predates
// the feature. Pages through vehicles_by_id; safe to re-run.
// Usage: bun run scripts/backfill-maintenance-due.ts
import { scylla } from "../lib/db/client";
import { backfillVehicleDue } from "../lib/vehicles/maintenance-backfill.service";
import { listVehiclePage } from "../lib/vehicles/maintenance-reminder.repository";

async function main(): Promise<number> {
  const counts = { vehicles: 0, written: 0, skipped: 0 };
  let pageState: string | null = null;
  try {
    do {
      const page = await listVehiclePage(pageState);
      for (const vehicle of page.vehicles) {
        counts.vehicles += 1;
        const outcome = await backfillVehicleDue(vehicle).catch(
          () => "skipped" as const,
        );
        counts[outcome === "written" ? "written" : "skipped"] += 1;
      }
      pageState = page.nextPageState;
    } while (pageState);
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[backfill:maintenance] vehicles ${counts.vehicles}, written ${counts.written}, skipped ${counts.skipped}`,
  );
  return 0;
}

process.exit(await main());
