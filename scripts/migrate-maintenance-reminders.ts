// Non-destructive migration for maintenance reminders. Adds three new
// tables and never touches existing rows. Safe to re-run.
// Usage: bun run scripts/migrate-maintenance-reminders.ts
import { scylla } from "../lib/db/client";

const STATEMENTS: { label: string; cql: string }[] = [
  {
    label: "maintenance_intervals_by_service",
    cql: `CREATE TABLE IF NOT EXISTS maintenance_intervals_by_service (
      service_id      uuid PRIMARY KEY,
      interval_months int,
      interval_km     int,
      updated_at      timestamp
    )`,
  },
  {
    label: "maintenance_due_by_month",
    cql: `CREATE TABLE IF NOT EXISTS maintenance_due_by_month (
      due_month      text,
      due_at         timestamp,
      vehicle_id     uuid,
      owner_id       uuid,
      next_due_km    int,
      reminder_group text,
      PRIMARY KEY ((due_month), due_at, vehicle_id)
    ) WITH CLUSTERING ORDER BY (due_at ASC, vehicle_id ASC)`,
  },
  {
    label: "maintenance_reminders_by_vehicle",
    cql: `CREATE TABLE IF NOT EXISTS maintenance_reminders_by_vehicle (
      vehicle_id     uuid,
      due_at         timestamp,
      reminder_group text,
      claimed_at     timestamp,
      PRIMARY KEY ((vehicle_id), due_at)
    ) WITH CLUSTERING ORDER BY (due_at DESC)`,
  },
];

// ALTER has no IF NOT EXISTS on ScyllaDB 3.0.8: an existing column is
// reported as a conflict, which is the expected re-run outcome.
const ALTERS: { label: string; cql: string }[] = [
  {
    label: "users_by_id.maintenance_opt_out",
    cql: "ALTER TABLE users_by_id ADD maintenance_opt_out boolean",
  },
];

async function main(): Promise<void> {
  try {
    for (const statement of STATEMENTS) {
      await scylla.execute(statement.cql);
      console.log(`ok: ${statement.label}`);
    }
    for (const alter of ALTERS) {
      try {
        await scylla.execute(alter.cql);
        console.log(`ok: ${alter.label}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/conflicts|already exist/i.test(message)) throw error;
        console.log(`skip: ${alter.label} (already present)`);
      }
    }
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error("migration failed:", error);
  process.exit(1);
});
