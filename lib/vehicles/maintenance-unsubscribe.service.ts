// Turns a valid signed link into a stored opt-out. Invalid ids and tokens
// change nothing and report false.
import { siteUrl } from "@/lib/seo/site";
import { isUuid } from "@/lib/validation";
import { setReminderOptOut } from "./maintenance-reminder.repository";
import {
  unsubscribeToken,
  verifyUnsubscribeToken,
} from "./maintenance-unsubscribe-token";

function signingSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("Missing AUTH_SECRET.");
  return secret;
}

export function buildUnsubscribeUrl(userId: string): string {
  const token = unsubscribeToken(userId, signingSecret());
  return `${siteUrl()}/api/maintenance/unsubscribe?u=${userId}&t=${token}`;
}

export async function optOutOfMaintenanceReminders(
  userId: string,
  token: string,
): Promise<boolean> {
  if (!isUuid(userId)) return false;
  if (!verifyUnsubscribeToken(userId, token, signingSecret())) return false;
  await setReminderOptOut(userId, true);
  return true;
}
