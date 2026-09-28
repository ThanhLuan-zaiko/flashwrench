// Non-destructive schema migration for the revenue feature.
// Applies the new payment columns and the two revenue tables on the live
// keyspace WITHOUT dropping data (unlike reset_data.sh). Safe to re-run:
// duplicate-column errors and existing tables are skipped.
// Usage: bun run scripts/migrate-revenue.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "bookings_by_id.payment_confirm_code",
    cql: "ALTER TABLE bookings_by_id ADD payment_confirm_code text",
  },
  {
    label: "emergency_by_id.payment_confirm_code",
    cql: "ALTER TABLE emergency_by_id ADD payment_confirm_code text",
  },
  {
    label: "payments_by_id.mechanic_id",
    cql: "ALTER TABLE payments_by_id ADD mechanic_id uuid",
  },
  {
    label: "payments_by_id.recorded_by",
    cql: "ALTER TABLE payments_by_id ADD recorded_by uuid",
  },
  {
    label: "payments_by_id.customer_confirmed",
    cql: "ALTER TABLE payments_by_id ADD customer_confirmed boolean",
  },
  {
    label: "payments_by_period",
    cql: `CREATE TABLE IF NOT EXISTS payments_by_period (
      bucket             text,
      paid_at            timestamp,
      payment_id         uuid,
      ref_type           text,
      ref_id             uuid,
      customer_id        uuid,
      mechanic_id        uuid,
      amount             bigint,
      method             text,
      status             text,
      recorded_by        uuid,
      customer_confirmed boolean,
      PRIMARY KEY ((bucket), paid_at, payment_id)
    ) WITH CLUSTERING ORDER BY (paid_at DESC, payment_id ASC)`,
  },
  {
    label: "payment_audit_by_day",
    cql: `CREATE TABLE IF NOT EXISTS payment_audit_by_day (
      bucket     text,
      event_at   timestamp,
      event_id   uuid,
      actor_id   uuid,
      action     text,
      ref_type   text,
      ref_id     uuid,
      payment_id uuid,
      amount     bigint,
      method     text,
      detail     text,
      PRIMARY KEY ((bucket), event_at, event_id)
    ) WITH CLUSTERING ORDER BY (event_at DESC, event_id ASC)`,
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
    `[migrate:revenue] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
      `[migrate:revenue] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:revenue] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
