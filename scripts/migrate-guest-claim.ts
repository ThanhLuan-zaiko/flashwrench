// Non-destructive schema migration for the guest-record claim feature.
// Creates the two contact-pair lookup tables on the live keyspace WITHOUT
// dropping data (unlike reset_data.sh). Safe to re-run: existing tables
// are skipped via IF NOT EXISTS.
// Usage: bun run scripts/migrate-guest-claim.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "guest_bookings_by_phone",
    cql: `CREATE TABLE IF NOT EXISTS guest_bookings_by_phone (
      phone      text,
      booking_id uuid,
      created_at timestamp,
      email      text,
      PRIMARY KEY ((phone), booking_id)
    )`,
  },
  {
    label: "guest_orders_by_phone",
    cql: `CREATE TABLE IF NOT EXISTS guest_orders_by_phone (
      phone      text,
      order_id   uuid,
      created_at timestamp,
      email      text,
      PRIMARY KEY ((phone), order_id)
    )`,
  },
];

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(
    `[migrate:guest-claim] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
        const message = error instanceof Error ? error.message : String(error);
        if (/already exists/i.test(message)) {
          skipped += 1;
          console.log(`  = ${statement.label}: already present, skipped`);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(
      `[migrate:guest-claim] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:guest-claim] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
