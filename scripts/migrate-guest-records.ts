// Non-destructive schema migration for the browser-keyed guest record index.
// Adds guest_records_by_gid on the live keyspace WITHOUT dropping data
// (unlike reset_data.sh). Safe to re-run: an existing table is skipped.
// Usage: bun run scripts/migrate-guest-records.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "guest_records_by_gid",
    cql: `CREATE TABLE IF NOT EXISTS guest_records_by_gid (
      guest_id    uuid,
      created_at  timestamp,
      record_type text,
      record_id   uuid,
      PRIMARY KEY ((guest_id), created_at, record_type, record_id)
    ) WITH CLUSTERING ORDER BY (created_at DESC, record_type ASC, record_id ASC)`,
  },
];

function isAlreadyApplied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|conflicts with|duplicate/i.test(message);
}

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(
    `[migrate:guest-records] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
      `[migrate:guest-records] Failed: ${
        error instanceof Error ? error.message : error
      }`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:guest-records] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  console.log(
    "[migrate:guest-records] Note: jobs filed before this migration are not backfilled; they stay reachable through /lookup.",
  );
  return 0;
}

process.exit(await main());
