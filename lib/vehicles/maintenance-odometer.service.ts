// Odometer-based reminders. A visit may set only a km due (no cadence in
// months); the reminder fires once when a saved odometer reaches it. Time
// based reminders still run through the daily scan.
import {
  deliverReminder,
  formatKm,
  type ReminderOutcome,
  remindersEnabled,
} from "./maintenance-delivery";
import { findLatestVisit } from "./maintenance-reminder.repository";
import { reminderGroupOf } from "./maintenance-schedule";
import { findVehicleRowById } from "./vehicle.repository";

export async function remindOnOdometer(
  vehicleId: string,
  odometerKm: number | null,
): Promise<ReminderOutcome | "none"> {
  if (!remindersEnabled() || odometerKm === null) return "none";
  const latest = await findLatestVisit(vehicleId);
  if (!latest || latest.nextDueAt !== null || latest.nextDueKm === null) {
    return "none";
  }
  if (odometerKm < latest.nextDueKm) return "none";
  const vehicle = await findVehicleRowById(vehicleId);
  if (!vehicle?.owner_id) return "none";
  return deliverReminder({
    vehicleId,
    ownerId: vehicle.owner_id,
    // The visit date keys the claim: one odometer reminder per visit.
    reminderKey: latest.servedAt,
    reminderGroup: reminderGroupOf(vehicleId),
    dueText: `khi số km đạt khoảng ${formatKm(latest.nextDueKm)}`,
  });
}
