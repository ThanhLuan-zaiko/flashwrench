// Non-destructive schema migration for the guest-access (OTP) feature.
// Adds the email OTP table, the email-keyed guest record index and the
// missing rescue email column on the live keyspace WITHOUT dropping data
// (unlike reset_data.sh). Safe to re-run: duplicate-column errors and
// existing tables are skipped.
// Usage: bun run scripts/migrate-guest-access.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "email_otps",
    cql: `CREATE TABLE IF NOT EXISTS email_otps (
      email       text,
      purpose     text,
      code_hash   text,
      attempts    int,
      expires_at  timestamp,
      created_at  timestamp,
      PRIMARY KEY ((email, purpose))
    )`,
  },
  {
    label: "guest_records_by_email",
    cql: `CREATE TABLE IF NOT EXISTS guest_records_by_email (
      email       text,
      created_at  timestamp,
      record_type text,
      record_id   uuid,
      phone       text,
      PRIMARY KEY ((email), created_at, record_type, record_id)
    ) WITH CLUSTERING ORDER BY (created_at DESC, record_type ASC, record_id ASC)`,
  },
  {
    label: "emergency_by_id.customer_email",
    cql: "ALTER TABLE emergency_by_id ADD customer_email text",
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
    `[migrate:guest-access] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
      `[migrate:guest-access] Failed: ${
        error instanceof Error ? error.message : error
      }`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:guest-access] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  console.log(
    "[migrate:guest-access] Note: existing guest rows are not backfilled into guest_records_by_email.",
  );
  return 0;
}

process.exit(await main());
