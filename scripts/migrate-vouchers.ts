// Non-destructive schema migration for account-bound voucher wallets.
// Adds campaign + wallet tables without touching existing data.
// Safe to re-run: existing tables are skipped.
// Usage: bun run scripts/migrate-vouchers.ts
import { scylla } from "../lib/db/client";

type Statement = { label: string; cql: string };

const STATEMENTS: Statement[] = [
  {
    label: "voucher_campaigns_by_id",
    cql: `CREATE TABLE IF NOT EXISTS voucher_campaigns_by_id (
      campaign_id            uuid PRIMARY KEY,
      code                   text,
      name                   text,
      description            text,
      image_url              text,
      discount_type          text,
      discount_value         bigint,
      max_discount           bigint,
      min_order              bigint,
      scope                  text,
      start_at               timestamp,
      end_at                 timestamp,
      total_limit            int,
      granted_count          int,
      per_user_limit         int,
      allow_dispatcher_grant boolean,
      dispatcher_max_value   bigint,
      is_active              boolean,
      created_by             uuid,
      created_at             timestamp,
      updated_at             timestamp
    )`,
  },
  {
    label: "voucher_campaigns_by_code",
    cql: `CREATE TABLE IF NOT EXISTS voucher_campaigns_by_code (
      code        text PRIMARY KEY,
      campaign_id uuid
    )`,
  },
  {
    label: "voucher_wallets_by_id",
    cql: `CREATE TABLE IF NOT EXISTS voucher_wallets_by_id (
      wallet_id      uuid PRIMARY KEY,
      user_id        uuid,
      campaign_id    uuid,
      campaign_code  text,
      campaign_name  text,
      image_url      text,
      discount_type  text,
      discount_value bigint,
      max_discount   bigint,
      status         text,
      granted_by     uuid,
      grant_note     text,
      granted_at     timestamp,
      expires_at     timestamp,
      used_at        timestamp,
      used_order_id  uuid,
      used_booking_id uuid
    )`,
  },
  {
    label: "voucher_wallets_by_user",
    cql: `CREATE TABLE IF NOT EXISTS voucher_wallets_by_user (
      user_id    uuid,
      granted_at timestamp,
      wallet_id  uuid,
      campaign_id uuid,
      status     text,
      PRIMARY KEY ((user_id), granted_at, wallet_id)
    ) WITH CLUSTERING ORDER BY (granted_at DESC, wallet_id ASC)`,
  },
  {
    label: "voucher_wallets_by_campaign",
    cql: `CREATE TABLE IF NOT EXISTS voucher_wallets_by_campaign (
      campaign_id uuid,
      granted_at  timestamp,
      wallet_id   uuid,
      user_id     uuid,
      status      text,
      PRIMARY KEY ((campaign_id), granted_at, wallet_id)
    ) WITH CLUSTERING ORDER BY (granted_at DESC, wallet_id ASC)`,
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
    `[migrate:vouchers] Applying ${STATEMENTS.length} statements to "${keyspace}"...`,
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
      `[migrate:vouchers] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
  console.log(
    `[migrate:vouchers] Done — ${applied} applied, ${skipped} skipped. No data touched.`,
  );
  return 0;
}

process.exit(await main());
