import {
  deleteTempPassword,
  findTempPassword,
  saveTempPassword,
} from "./staff-temp.repository";
import { decryptTempPassword, encryptTempPassword } from "./staff-temp-crypto";

// Pending temp-password orchestration: persist on staff creation, clear on
// password change or hard delete, and decrypt the rows a page asks for.
// Storage failures on persist/clear are swallowed so account creation and
// password change never break because of this auxiliary table; persist
// failures are logged so a missing STAFF_TEMP_SECRET stays visible.

export type PendingStaffPassword = {
  userId: string;
  tempPassword: string;
  createdAt: string | null;
};

const MAX_IDS = 200;

export async function persistTempPassword(
  userId: string,
  plain: string,
  createdBy: string,
): Promise<void> {
  try {
    await saveTempPassword(userId, await encryptTempPassword(plain), createdBy);
  } catch (error) {
    console.warn("[staff-temp] persist failed:", (error as Error)?.message);
  }
}

export async function clearTempPassword(userId: string): Promise<void> {
  try {
    await deleteTempPassword(userId);
  } catch (error) {
    console.warn("[staff-temp] clear failed:", (error as Error)?.message);
  }
}

function cleanIds(userIds: string[]): string[] {
  const seen = new Set<string>();
  for (const id of userIds) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || trimmed.length > 120) continue;
    seen.add(trimmed);
    if (seen.size >= MAX_IDS) break;
  }
  return [...seen];
}

// Decrypt pending passwords for exactly the ids the page already shows.
// Bounded single-partition reads: no role-bucket scan, so opening the
// staff tab costs N small reads instead of ~100 partition reads. Unknown
// or undecryptable rows are skipped so one bad row cannot break the list.
export async function listPendingTempPasswords(
  userIds: string[],
): Promise<PendingStaffPassword[]> {
  const settled = await Promise.all(
    cleanIds(userIds).map(async (userId) => {
      try {
        const row = await findTempPassword(userId);
        if (!row?.temp_password_enc) return null;
        return {
          userId,
          tempPassword: await decryptTempPassword(row.temp_password_enc),
          createdAt: row.created_at
            ? new Date(row.created_at).toISOString()
            : null,
        } satisfies PendingStaffPassword;
      } catch {
        return null;
      }
    }),
  );
  return settled.filter((x): x is PendingStaffPassword => x !== null);
}
