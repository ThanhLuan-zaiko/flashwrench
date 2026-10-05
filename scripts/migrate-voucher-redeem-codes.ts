// Non-destructive migration for redeem codes: adds the redeem_code
// column to campaigns and creates the code lookup + claim lock tables.
// No backfill — legacy campaigns simply carry no redeem code.
// Safe to re-run: duplicate-column errors are skipped, CREATE TABLE
// IF NOT EXISTS is idempotent. No data is dropped or reset.
// Usage: bun run scripts/migrate-voucher-redeem-codes.ts

import { scylla } from "../lib/db/client";

const ADD_REDEEM_CODE =
  "ALTER TABLE voucher_campaigns_by_id ADD redeem_code text";
const CREATE_BY_REDEEM_CODE = `CREATE TABLE IF NOT EXISTS voucher_campaigns_by_redeem_code (
  redeem_code text PRIMARY KEY,
  campaign_id uuid
)`;
const CREATE_CODE_CLAIMS = `CREATE TABLE IF NOT EXISTS voucher_code_claims (
  campaign_id uuid,
  user_id     uuid,
  seq         int,
  wallet_id   uuid,
  claimed_at  timestamp,
  PRIMARY KEY ((campaign_id, user_id), seq)
)`;

function isAlreadyApplied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|conflicts with|duplicate|Invalid column/i.test(
    message,
  );
}

async function main(): Promise<number> {
  const keyspace = process.env.SCYLLA_KEYSPACE ?? "flashwrench";
  console.log(`[migrate:voucher-redeem-codes] Applying to "${keyspace}"...`);
  try {
    await scylla.connect();
    try {
      await scylla.execute(ADD_REDEEM_CODE, [], { prepare: false });
      console.log("  + voucher_campaigns_by_id.redeem_code: applied");
    } catch (error) {
      if (!isAlreadyApplied(error)) throw error;
      console.log(
        "  = voucher_campaigns_by_id.redeem_code: already present, skipped",
      );
    }
    await scylla.execute(CREATE_BY_REDEEM_CODE, [], { prepare: false });
    console.log("  + voucher_campaigns_by_redeem_code: ready");
    await scylla.execute(CREATE_CODE_CLAIMS, [], { prepare: false });
    console.log("  + voucher_code_claims: ready");
    console.log("[migrate:voucher-redeem-codes] Done.");
    return 0;
  } catch (error) {
    console.error(
      `[migrate:voucher-redeem-codes] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

process.exit(await main());
