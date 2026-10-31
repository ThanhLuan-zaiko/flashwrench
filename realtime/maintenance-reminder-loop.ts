// Daily maintenance reminder scan, hosted in the realtime gateway like the
// win-back loop. The global flag keeps one timer per process across hot
// reloads; the reminder ledger claim keeps overlapping runs from mailing
// the same vehicle twice.
import { remindersEnabled } from "@/lib/vehicles/maintenance-delivery";
import { runMaintenanceReminderScan } from "@/lib/vehicles/maintenance-reminder.service";

const SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const RUN_HOUR_LOCAL = 8;

declare global {
  // eslint-disable-next-line no-var
  var maintenanceReminderLoopStarted: boolean | undefined;
}

function msUntilNextRun(now = new Date()): number {
  const next = new Date(now);
  next.setHours(RUN_HOUR_LOCAL, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function scanOnce(): Promise<void> {
  try {
    const result = await runMaintenanceReminderScan();
    if (result.sent > 0 || result.holdout > 0) {
      console.log(
        `[maintenance] sent ${result.sent}, holdout ${result.holdout}, skipped ${result.skipped} of ${result.scanned} due`,
      );
    }
  } catch (error) {
    console.error("[maintenance] scan failed:", error);
  }
}

export function startMaintenanceReminderLoop(): void {
  if (!remindersEnabled()) return;
  if (globalThis.maintenanceReminderLoopStarted) return;
  globalThis.maintenanceReminderLoopStarted = true;
  setTimeout(() => {
    void scanOnce();
    setInterval(() => void scanOnce(), SCAN_INTERVAL_MS);
  }, msUntilNextRun());
}
