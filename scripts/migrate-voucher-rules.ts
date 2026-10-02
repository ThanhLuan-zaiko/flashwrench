// Non-destructive schema migration for voucher auto-grant rules and the
// per-customer activity rollup. Adds tables without touching existing data.
// Safe to re-run: existing tables are skipped.
// Usage: bun run scripts/migrate-voucher-rules.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "voucher_auto_rules_by_id",
    cql: `CREATE TABLE IF NOT EXISTS voucher_auto_rules_by_id (
      rule_id       uuid PRIMARY KEY,
      name          text,
      campaign_id   uuid,
      trigger_type  text,
      threshold     bigint,
      window_days   int,
      is_active     boolean,
      granted_count int,
      created_by    uuid,
      created_at    timestamp,
      updated_at    timestamp
    )`,
  },
  {
    label: "voucher_auto_grants_by_rule",
    cql: `CREATE TABLE IF NOT EXISTS voucher_auto_grants_by_rule (
      rule_id    uuid,
      user_id    uuid,
      dedupe_key text,
      wallet_id  uuid,
      granted_at timestamp,
      PRIMARY KEY ((rule_id, user_id), dedupe_key)
    ) WITH CLUSTERING ORDER BY (dedupe_key ASC)`,
  },
  {
    label: "customer_stats_by_id",
    cql: `CREATE TABLE IF NOT EXISTS customer_stats_by_id (
      customer_id        uuid PRIMARY KEY,
      completed_bookings int,
      completed_orders   int,
      total_spent        bigint,
      last_activity_at   timestamp,
      updated_at         timestamp
    )`,
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
    `[migrate:voucher-rules] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
      `[migrate:voucher-rules] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:voucher-rules] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
