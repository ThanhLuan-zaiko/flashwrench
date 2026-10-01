// Raw CQL for one-time codes. No business logic: the OTP service owns the
// expiry, cooldown and attempt policy, this layer only persists rows.
import { scylla } from "@/lib/db/client";
import type { OtpPurpose, OtpRow } from "./otp.types";

export type PutOtpWrite = {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
  /** Row lifetime in seconds. Passing it as a TTL means an abandoned code
   *  disappears on its own — no sweeper job, no unbounded growth. */
  ttlSeconds: number;
};

// One row per (email, purpose): a resend overwrites in place, so a stale
// earlier code can never stay valid alongside its replacement.
export async function putEmailOtp(write: PutOtpWrite): Promise<void> {
  await scylla.execute(
    `INSERT INTO email_otps (email, purpose, code_hash, attempts, expires_at, created_at)
     VALUES (?, ?, ?, 0, ?, ?) USING TTL ?`,
    [
      write.email,
      write.purpose,
      write.codeHash,
      write.expiresAt,
      write.createdAt,
      write.ttlSeconds,
    ],
    { prepare: true },
  );
}

export async function findEmailOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<OtpRow | null> {
  const result = await scylla.execute(
    "SELECT code_hash, attempts, expires_at, created_at FROM email_otps WHERE email = ? AND purpose = ?",
    [email, purpose],
    { prepare: true },
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    code_hash: (row.code_hash as string | null) ?? null,
    attempts: typeof row.attempts === "number" ? row.attempts : null,
    expires_at: (row.expires_at as Date | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
  };
}

export async function bumpEmailOtpAttempts(
  email: string,
  purpose: OtpPurpose,
  attempts: number,
): Promise<void> {
  await scylla.execute(
    "UPDATE email_otps SET attempts = ? WHERE email = ? AND purpose = ?",
    [attempts, email, purpose],
    { prepare: true },
  );
}

export async function deleteEmailOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<void> {
  await scylla.execute(
    "DELETE FROM email_otps WHERE email = ? AND purpose = ?",
    [email, purpose],
    { prepare: true },
  );
}
