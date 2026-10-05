// Non-destructive schema migration for the shop settings feature.
// Creates the single-row shop_profile and business_hours tables on the
// live keyspace WITHOUT dropping data. Safe to re-run: CREATE uses IF
// NOT EXISTS so existing tables are skipped.
// Usage: bun run scripts/migrate-shop-settings.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "shop_profile",
    cql: `CREATE TABLE IF NOT EXISTS shop_profile (
      config_id    text PRIMARY KEY,
      display_name text,
      hotline      text,
      address      text,
      updated_at   timestamp,
      updated_by   uuid
    )`,
  },
  {
    label: "business_hours",
    cql: `CREATE TABLE IF NOT EXISTS business_hours (
      config_id     text PRIMARY KEY,
      enabled       boolean,
      opens_at_min  int,
      closes_at_min int,
      timezone      text,
      updated_at    timestamp,
      updated_by    uuid
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
    `[migrate:shop-settings] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
      `[migrate:shop-settings] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:shop-settings] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
