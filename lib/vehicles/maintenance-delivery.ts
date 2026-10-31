// One reminder for one vehicle: claim first, then mail. Shared by the daily
// due-date scan and the odometer trigger. Holdout vehicles are claimed
// without mail so the comparison group is recorded the same way.
import { findUserById } from "@/lib/auth/user.repository";
import { DEFAULT_TIME_ZONE } from "@/lib/datetime/timezone";
import { mailLogoAttachments } from "@/lib/mail/email-shell";
import { isMailConfigured } from "@/lib/mail/mail.config";
import { sendMail } from "@/lib/mail/mailer.service";
import { buildMaintenanceReminderEmail } from "@/lib/mail/maintenance-email";
import {
  claimReminder,
  findReminderOptOut,
  releaseReminderClaim,
} from "./maintenance-reminder.repository";
import { buildUnsubscribeUrl } from "./maintenance-unsubscribe.service";
import { findVehicleRowById } from "./vehicle.repository";

export type ReminderOutcome = "sent" | "holdout" | "skipped";

// Opt-in switch: reminders stay off until the shop confirms its cadences.
export function remindersEnabled(): boolean {
  return process.env.MAINTENANCE_REMINDERS_ENABLED === "true";
}

export function formatDueDate(dueAt: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: DEFAULT_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dueAt);
}

export function formatKm(km: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(km)} km`;
}

function vehicleLabel(brand: string | null, model: string | null): string {
  return [brand, model].filter((part) => part?.trim()).join(" ");
}

export async function deliverReminder(params: {
  vehicleId: string;
  ownerId: string | null;
  reminderKey: Date;
  reminderGroup: string;
  dueText: string;
}): Promise<ReminderOutcome> {
  if (params.reminderGroup === "holdout") {
    const claimed = await claimReminder({
      vehicleId: params.vehicleId,
      reminderKey: params.reminderKey,
      reminderGroup: "holdout",
      claimedAt: new Date(),
    });
    return claimed ? "holdout" : "skipped";
  }
  if (!params.ownerId || !isMailConfigured()) return "skipped";
  const vehicle = await findVehicleRowById(params.vehicleId);
  if (!vehicle || vehicle.is_archived === true) return "skipped";
  if (await findReminderOptOut(params.ownerId)) return "skipped";
  const user = await findUserById(params.ownerId).catch(() => null);
  const to = typeof user?.email === "string" ? user.email.trim() : "";
  if (!to) return "skipped";

  const claimed = await claimReminder({
    vehicleId: params.vehicleId,
    reminderKey: params.reminderKey,
    reminderGroup: "treatment",
    claimedAt: new Date(),
  });
  if (!claimed) return "skipped";
  try {
    const content = buildMaintenanceReminderEmail({
      vehicleName: vehicleLabel(vehicle.brand, vehicle.model),
      dueText: params.dueText,
      unsubscribeUrl: buildUnsubscribeUrl(params.ownerId),
    });
    await sendMail({ to, ...content, attachments: mailLogoAttachments() });
    return "sent";
  } catch {
    await releaseReminderClaim(params.vehicleId, params.reminderKey);
    return "skipped";
  }
}
