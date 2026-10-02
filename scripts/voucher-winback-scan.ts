// Win-back sweep for voucher auto-grant rules: scans the customer
// activity rollup and pays the rule's campaign to customers who have been
// inactive for its window. Safe to re-run and safe to schedule — the
// monthly dedupe bucket caps each customer at one voucher per month.
// Usage: bun run scripts/voucher-winback-scan.ts
import { scylla } from "../lib/db/client";
import { runVoucherWinBackScan } from "../lib/vouchers/auto-grant-winback.service";

async function main(): Promise<number> {
  try {
    const result = await runVoucherWinBackScan();
    console.log(
      `[voucher-winback] scanned=${result.scannedCustomers} granted=${result.granted}`,
    );
    return 0;
  } catch (error) {
    console.error(
      `[voucher-winback] Failed: ${error instanceof Error ? error.message : error}`,
    );
    return 1;
  } finally {
    await scylla.shutdown().catch(() => undefined);
  }
}

process.exit(await main());
