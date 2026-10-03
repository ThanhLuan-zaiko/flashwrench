// Non-destructive schema migration for the customer-mix report.
// Creates the member-vs-guest daily counter table plus the unique-actor
// ledger on the live keyspace WITHOUT touching existing data.
// Safe to re-run.
// Usage: bun run scripts/migrate-customer-mix.ts
import { scylla } from "../lib/db/client";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS customer_mix_daily (
  day     TEXT,
  kind    TEXT,
  channel TEXT,
  total   COUNTER,
  PRIMARY KEY ((day), kind, channel)
)`,
  `CREATE TABLE IF NOT EXISTS customer_mix_actors (
  day     TEXT,
  kind    TEXT,
  channel TEXT,
  actor   TEXT,
  PRIMARY KEY ((day), kind, channel, actor)
)`,
];

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(`[migrate:customer-mix] Creating tables in "${keyspace}"...`);
  try {
    await scylla.connect();
    for (const statement of STATEMENTS) {
      await scylla.execute(statement, [], { prepare: false });
    }
  } catch (error) {
    console.error(
      `[migrate:customer-mix] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log("[migrate:customer-mix] Done. No data touched.");
  return 0;
}

process.exit(await main());
