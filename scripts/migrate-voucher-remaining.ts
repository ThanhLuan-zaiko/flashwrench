// Non-destructive migration for partial voucher spends. Adds the
// remaining_value column and backfills it from the face value, so every
// existing wallet starts with its full value still spendable. Safe to
// re-run: the column is skipped when present and the backfill only touches
// rows still missing a value.
// Usage: bun run scripts/migrate-voucher-remaining.ts
import { scylla } from "../lib/db/client";

async function addColumn(): Promise<void> {
  try {
    await scylla.execute(
      "ALTER TABLE voucher_wallets_by_id ADD remaining_value bigint",
    );
    console.log("ok: voucher_wallets_by_id.remaining_value");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/conflicts|already exist/i.test(message)) throw error;
    console.log(
      "skip: voucher_wallets_by_id.remaining_value (already present)",
    );
  }
}

async function backfill(): Promise<number> {
  let filled = 0;
  let pageState: string | null = null;
  do {
    const result: { rows: unknown[]; pageState?: string | null } =
      await scylla.execute(
        "SELECT wallet_id, discount_value, remaining_value FROM voucher_wallets_by_id",
        [],
        { prepare: true, fetchSize: 200, ...(pageState ? { pageState } : {}) },
      );
    for (const raw of result.rows) {
      const row = raw as unknown as {
        wallet_id: unknown;
        discount_value: number | null;
        remaining_value: number | null;
      };
      if (row.remaining_value !== null || row.discount_value === null) continue;
      await scylla.execute(
        "UPDATE voucher_wallets_by_id SET remaining_value = ? WHERE wallet_id = ?",
        [row.discount_value, row.wallet_id],
        { prepare: true },
      );
      filled += 1;
    }
    pageState = result.pageState ?? null;
  } while (pageState);
  return filled;
}

async function main(): Promise<void> {
  try {
    await addColumn();
    const filled = await backfill();
    console.log(`backfill: ${filled} wallet(s) given their face value`);
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

await main();
