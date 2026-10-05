// Non-destructive schema migration for the booking intake config feature.
// Creates the single-row booking_config table on the live keyspace WITHOUT
// dropping data (unlike reset_data.sh). Safe to re-run: the CREATE uses IF
// NOT EXISTS so an existing table is skipped.
// Usage: bun run scripts/migrate-booking-config.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "booking_config",
    cql: `CREATE TABLE IF NOT EXISTS booking_config (
      config_id     text PRIMARY KEY,
      min_lead_days int,
      updated_at    timestamp,
      updated_by    uuid
    )`,
  },
  // ScyllaDB 3.0.8 has no ALTER ... ADD IF NOT EXISTS; the "conflicts with"
  // catch in isAlreadyApplied keeps re-runs safe.
  {
    label: "booking_config.max_advance_days",
    cql: "ALTER TABLE booking_config ADD max_advance_days int",
  },
  {
    label: "booking_config.cancel_cutoff_hours",
    cql: "ALTER TABLE booking_config ADD cancel_cutoff_hours int",
  },
  {
    label: "booking_config.guest_booking_enabled",
    cql: "ALTER TABLE booking_config ADD guest_booking_enabled boolean",
  },
];

function isAlreadyApplied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|conflicts with|duplicate|Invalid column/i.test(
    message,
  );
}

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(
    `[migrate:booking-config] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
  );
  let applied = 0;
  let skipped = 0;
  try {
    await scylla.connect();
    for (const statement of STATEMENTS) {
      try {
        await scylla.execute(statement.cql, [], { prepare: false });
        applied += 1;
        console.log(`  + ${statement.label}: applied`);
      } catch (error) {
        if (isAlreadyApplied(error)) {
          skipped += 1;
          console.log(`  = ${statement.label}: already present, skipped`);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(
      `[migrate:booking-config] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:booking-config] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
