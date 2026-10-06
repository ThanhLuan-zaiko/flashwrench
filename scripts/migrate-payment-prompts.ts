// Non-destructive schema migration for the payment-prompt feature.
// Adds the courier COD confirm code on orders and the per-customer
// payment-prompt index the site banner reads — WITHOUT dropping data
// (unlike reset_data.sh). Safe to re-run: duplicate-column errors and
// existing tables are skipped.
// Usage: bun run scripts/migrate-payment-prompts.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "orders_by_id.payment_confirm_code",
    cql: "ALTER TABLE orders_by_id ADD payment_confirm_code text",
  },
  {
    label: "payment_prompts_by_customer",
    cql: `CREATE TABLE IF NOT EXISTS payment_prompts_by_customer (
      customer_id uuid,
      ref_type    text,
      ref_id      uuid,
      title       text,
      amount_due  bigint,
      issued_at   timestamp,
      PRIMARY KEY ((customer_id), ref_type, ref_id)
    ) WITH CLUSTERING ORDER BY (ref_type ASC, ref_id ASC)`,
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
    `[migrate:payment-prompts] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
      `[migrate:payment-prompts] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:payment-prompts] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
