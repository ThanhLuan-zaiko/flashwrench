import { scylla } from "@/lib/db/client";
import { monthBucket, type UserRow } from "./user.types";

function rowToUser(row: Record<string, unknown>): UserRow {
  const version = row.token_version;
  return {
    user_id: String(row.user_id),
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    password_hash: (row.password_hash as string | null) ?? null,
    full_name: (row.full_name as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    token_version: typeof version === "number" ? version : 0,
    created_at: (row.created_at as Date | null) ?? null,
    updated_at: (row.updated_at as Date | null) ?? null,
  };
}

export async function findUserById(userId: string): Promise<UserRow | null> {
  const result = await scylla.execute(
    "SELECT user_id, phone, email, password_hash, full_name, role, avatar_url, status, token_version, created_at, updated_at FROM users_by_id WHERE user_id = ?",
    [userId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? rowToUser(row) : null;
}

export async function findUserIdByPhone(phone: string): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT user_id FROM users_by_phone WHERE phone = ?",
    [phone],
    { prepare: true },
  );
  const row = result.first() as unknown as { user_id: unknown } | null;
  return row?.user_id ? String(row.user_id) : null;
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const result = await scylla.execute(
    "SELECT user_id FROM users_by_email WHERE email = ?",
    [email],
    { prepare: true },
  );
  const row = result.first() as unknown as { user_id: unknown } | null;
  return row?.user_id ? String(row.user_id) : null;
}

export type CreateUserParams = {
  userId: string;
  phone: string;
  email: string;
  passwordHash: string;
  fullName: string;
};

export type CreateUserOutcome =
  | { ok: true }
  | { ok: false; conflict: "phone" | "email" };

function wasApplied(result: unknown): boolean {
  const row = (result as { first: () => unknown }).first() as Record<
    string,
    unknown
  > | null;
  return row?.["[applied]"] === true;
}

async function claimPhone(phone: string, userId: string): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO users_by_phone (phone, user_id) VALUES (?, ?) IF NOT EXISTS",
    [phone, userId],
    { prepare: true },
  );
  return wasApplied(result);
}

async function claimEmail(email: string, userId: string): Promise<boolean> {
  const result = await scylla.execute(
    "INSERT INTO users_by_email (email, user_id) VALUES (?, ?) IF NOT EXISTS",
    [email, userId],
    { prepare: true },
  );
  return wasApplied(result);
}

async function releasePhone(phone: string): Promise<void> {
  await scylla
    .execute("DELETE FROM users_by_phone WHERE phone = ?", [phone], {
      prepare: true,
    })
    .catch(() => undefined);
}

async function releaseEmail(email: string): Promise<void> {
  await scylla
    .execute("DELETE FROM users_by_email WHERE email = ?", [email], {
      prepare: true,
    })
    .catch(() => undefined);
}

// Atomic register: lookup tables are claimed with LWT first, so concurrent
// registers with the same phone/email cannot both succeed. The pre-check in
// the service stays for friendly errors; this is the authoritative guard.
export async function createUser(
  params: CreateUserParams,
): Promise<CreateUserOutcome> {
  const phoneClaimed = await claimPhone(params.phone, params.userId);
  if (!phoneClaimed) return { ok: false, conflict: "phone" };

  const emailClaimed = await claimEmail(params.email, params.userId);
  if (!emailClaimed) {
    await releasePhone(params.phone);
    return { ok: false, conflict: "email" };
  }

  const now = new Date();
  const bucket = monthBucket(now);

  try {
    await scylla.batch(
      [
        {
          query:
            "INSERT INTO users_by_id (user_id, phone, email, password_hash, full_name, role, avatar_url, status, token_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'customer', null, 'active', 0, ?, ?)",
          params: [
            params.userId,
            params.phone,
            params.email,
            params.passwordHash,
            params.fullName,
            now,
            now,
          ],
        },
        {
          query:
            "INSERT INTO users_by_role (role, month_bucket, created_at, user_id, full_name, phone, email, status) VALUES ('customer', ?, ?, ?, ?, ?, ?, 'active')",
          params: [
            bucket,
            now,
            params.userId,
            params.fullName,
            params.phone,
            params.email,
          ],
        },
      ],
      { prepare: true },
    );
  } catch (error) {
    await Promise.all([releasePhone(params.phone), releaseEmail(params.email)]);
    throw error;
  }
  return { ok: true };
}

export async function bumpTokenVersion(userId: string): Promise<number> {
  const row = await findUserById(userId);
  const next = (row?.token_version ?? 0) + 1;
  await scylla.execute(
    "UPDATE users_by_id SET token_version = ?, updated_at = ? WHERE user_id = ?",
    [next, new Date(), userId],
    { prepare: true },
  );
  return next;
}

export async function updatePassword(
  userId: string,
  passwordHash: string,
): Promise<void> {
  await scylla.execute(
    "UPDATE users_by_id SET password_hash = ?, updated_at = ? WHERE user_id = ?",
    [passwordHash, new Date(), userId],
    { prepare: true },
  );
}
