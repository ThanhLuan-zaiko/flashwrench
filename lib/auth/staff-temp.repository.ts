import { scylla } from "@/lib/db/client";

// Raw CQL for pending staff temp passwords. No business logic here: the
// service encrypts before saving and decrypts after reading. One row per
// staff account, keyed by user_id for single-partition reads.

export type StaffTempRow = {
  user_id: string;
  temp_password_enc: string | null;
  created_at: Date | null;
  created_by: string | null;
};

function toRow(raw: Record<string, unknown>): StaffTempRow {
  return {
    user_id: String(raw.user_id),
    temp_password_enc: (raw.temp_password_enc as string | null) ?? null,
    created_at: (raw.created_at as Date | null) ?? null,
    created_by: raw.created_by ? String(raw.created_by) : null,
  };
}

export async function saveTempPassword(
  userId: string,
  enc: string,
  createdBy: string,
): Promise<void> {
  await scylla.execute(
    "INSERT INTO staff_temp_passwords (user_id, temp_password_enc, created_at, created_by) VALUES (?, ?, ?, ?)",
    [userId, enc, new Date(), createdBy],
    { prepare: true },
  );
}

export async function findTempPassword(
  userId: string,
): Promise<StaffTempRow | null> {
  const result = await scylla.execute(
    "SELECT user_id, temp_password_enc, created_at, created_by FROM staff_temp_passwords WHERE user_id = ?",
    [userId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toRow(row) : null;
}

export async function deleteTempPassword(userId: string): Promise<void> {
  await scylla.execute("DELETE FROM staff_temp_passwords WHERE user_id = ?", [
    userId,
  ]);
}
