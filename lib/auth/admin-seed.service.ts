import { randomUUID } from "node:crypto";
import type { AdminSeedConfig } from "./admin-seed.config";
import { hashPassword } from "./password";
import {
  createUserWithRole,
  findUserById,
  findUserIdByEmail,
  findUserIdByPhone,
  hasAnyUserWithRole,
} from "./user.repository";
import {
  type FieldErrors,
  monthBucket,
  type PublicUser,
  toPublicUser,
} from "./user.types";
import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from "./validation";

export type SeedAdminOutcome =
  | { status: "created"; user: PublicUser }
  | { status: "exists"; user: PublicUser }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "conflict"; message: string }
  | { status: "refused"; message: string };

function cleanFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

// Month buckets for the single-admin guard, newest first.
// Partition key is (role, month_bucket), so each bucket is one cheap read.
function recentMonthBuckets(count: number, now: Date = new Date()): string[] {
  const buckets: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = 0; i < count; i += 1) {
    buckets.push(monthBucket(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return buckets;
}

async function anotherAdminExists(lookbackMonths: number): Promise<boolean> {
  for (const bucket of recentMonthBuckets(lookbackMonths)) {
    if (await hasAnyUserWithRole("admin", bucket)) return true;
  }
  return false;
}

// Idempotent bootstrap: same phone+email pointing to an existing admin is a
// no-op (never overwrites the password). Any other collision is a conflict
// so the script can never escalate an existing customer by accident.
export async function seedAdmin(
  config: AdminSeedConfig,
): Promise<SeedAdminOutcome> {
  const fullName = cleanFullName(config.fullName);
  const phone = normalizePhone(config.phone);
  const email = normalizeEmail(config.email);

  const errors: FieldErrors = {};
  const nameError = validateFullName(fullName);
  if (nameError) errors.fullName = nameError;
  const phoneError = validatePhone(phone);
  if (phoneError) errors.phone = phoneError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(config.password);
  if (passwordError) errors.password = passwordError;
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const [phoneOwner, emailOwner] = await Promise.all([
    findUserIdByPhone(phone),
    findUserIdByEmail(email),
  ]);

  if (phoneOwner && emailOwner && phoneOwner === emailOwner) {
    const existing = await findUserById(phoneOwner);
    if (existing && existing.role === "admin") {
      return { status: "exists", user: toPublicUser(existing) };
    }
    return {
      status: "conflict",
      message:
        "Phone and email are already taken by a non-admin user. Refusing to escalate.",
    };
  }
  if (phoneOwner || emailOwner) {
    return {
      status: "conflict",
      message: "Phone or email is already taken by another user.",
    };
  }

  if (
    config.enforceSingleAdmin &&
    (await anotherAdminExists(config.lookbackMonths))
  ) {
    return {
      status: "refused",
      message:
        "Another admin already exists. Refusing to seed a second bootstrap admin.",
    };
  }

  const userId = randomUUID();
  const created = await createUserWithRole({
    userId,
    phone,
    email,
    passwordHash: await hashPassword(config.password),
    fullName,
    role: "admin",
  });

  if (!created.ok) {
    return {
      status: "conflict",
      message: "Phone or email was claimed concurrently by another user.",
    };
  }

  const row = await findUserById(userId);
  if (!row) {
    return { status: "conflict", message: "Failed to read back seeded admin." };
  }
  return { status: "created", user: toPublicUser(row) };
}
