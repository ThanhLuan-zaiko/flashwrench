// Daily voucher win-back sweep, hosted inside the realtime gateway — the
// stack's only always-on Bun daemon, so no OS-level cron is needed. Safe
// under hot reload and multi-replica deploys: the global flag keeps one
// timer per process, and the grant ledger's monthly dedupe bucket caps
// each customer at one voucher per month even if two scans overlap.
import { runVoucherWinBackScan } from "@/lib/vouchers/auto-grant-winback.service";

const SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const RUN_HOUR_LOCAL = 3;

declare global {
  // eslint-disable-next-line no-var
  var voucherWinBackLoopStarted: boolean | undefined;
}

// First run at the next 03:00 local time (off-peak), then every 24h.
function msUntilNextRun(now = new Date()): number {
  const next = new Date(now);
  next.setHours(RUN_HOUR_LOCAL, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function scanOnce(): Promise<void> {
  try {
    const result = await runVoucherWinBackScan();
    if (result.granted > 0) {
      console.log(
        `[winback] granted ${result.granted} voucher(s) across ${result.scannedCustomers} customers`,
      );
    }
  } catch (error) {
    console.error("[winback] scan failed:", error);
  }
}

export function startVoucherWinBackLoop(): void {
  if (globalThis.voucherWinBackLoopStarted) return;
  globalThis.voucherWinBackLoopStarted = true;
  setTimeout(() => {
    void scanOnce();
    setInterval(() => void scanOnce(), SCAN_INTERVAL_MS);
  }, msUntilNextRun());
}
