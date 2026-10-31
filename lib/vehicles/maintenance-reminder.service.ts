// Daily scan for due-date reminders over the next LOOKAHEAD_DAYS. Each row
// goes through deliverReminder, so reruns and replicas never mail twice and
// one failing vehicle never stops the scan.
import {
  deliverReminder,
  formatDueDate,
  type ReminderOutcome,
} from "./maintenance-delivery";
import { listDueRows } from "./maintenance-reminder.repository";
import { dueMonthOf } from "./maintenance-schedule";

export const LOOKAHEAD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export type MaintenanceScanResult = {
  scanned: number;
  sent: number;
  holdout: number;
  skipped: number;
};

function monthsInWindow(from: Date, to: Date): string[] {
  return [...new Set([dueMonthOf(from), dueMonthOf(to)])];
}

async function outcomeFor(row: {
  vehicleId: string;
  ownerId: string | null;
  dueAt: Date;
  reminderGroup: string;
}): Promise<ReminderOutcome> {
  try {
    return await deliverReminder({
      vehicleId: row.vehicleId,
      ownerId: row.ownerId,
      reminderKey: row.dueAt,
      reminderGroup: row.reminderGroup,
      dueText: `vào khoảng ${formatDueDate(row.dueAt)}`,
    });
  } catch {
    return "skipped";
  }
}

export async function runMaintenanceReminderScan(
  now: Date = new Date(),
): Promise<MaintenanceScanResult> {
  const to = new Date(now.getTime() + LOOKAHEAD_DAYS * DAY_MS);
  const result: MaintenanceScanResult = {
    scanned: 0,
    sent: 0,
    holdout: 0,
    skipped: 0,
  };
  for (const month of monthsInWindow(now, to)) {
    const rows = await listDueRows(month, now, to);
    for (const row of rows) {
      result.scanned += 1;
      const outcome = await outcomeFor(row);
      if (outcome === "sent") result.sent += 1;
      else if (outcome === "holdout") result.holdout += 1;
      else result.skipped += 1;
    }
  }
  return result;
}
