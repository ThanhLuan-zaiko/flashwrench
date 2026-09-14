import { scylla } from "@/lib/db/client";
import { REFRESH_TTL_SECONDS } from "./session";

export type RefreshSessionRow = {
  user_id: string;
  family_id: string;
  token_hash: string;
  previous_token_hash: string | null;
  device_label: string | null;
  created_at: Date | null;
  rotated_at: Date | null;
  expires_at: Date | null;
};

export type UserSessionRow = {
  family_id: string;
  device_label: string | null;
  created_at: Date | null;
  expires_at: Date | null;
};

function toSessionRow(row: Record<string, unknown>): RefreshSessionRow {
  return {
    user_id: String(row.user_id),
    family_id: String(row.family_id),
    token_hash: String(row.token_hash),
    previous_token_hash: (row.previous_token_hash as string | null) ?? null,
    device_label: (row.device_label as string | null) ?? null,
    created_at: (row.created_at as Date | null) ?? null,
    rotated_at: (row.rotated_at as Date | null) ?? null,
    expires_at: (row.expires_at as Date | null) ?? null,
  };
}

function ttlLiteral(seconds: number): number {
  if (!Number.isInteger(seconds) || seconds <= 0)
    throw new Error("Invalid TTL");
  return seconds;
}

export async function createSession(params: {
  userId: string;
  familyId: string;
  tokenHash: string;
  deviceLabel: string;
  ttlSeconds?: number;
}): Promise<void> {
  const ttl = ttlLiteral(params.ttlSeconds ?? REFRESH_TTL_SECONDS);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000);
  await scylla.batch(
    [
      {
        query: `INSERT INTO refresh_sessions (user_id, family_id, token_hash, previous_token_hash, device_label, created_at, rotated_at, expires_at) VALUES (?, ?, ?, null, ?, ?, null, ?) USING TTL ${ttl}`,
        params: [
          params.userId,
          params.familyId,
          params.tokenHash,
          params.deviceLabel,
          now,
          expiresAt,
        ],
      },
      {
        query: `INSERT INTO refresh_sessions_by_user (user_id, created_at, family_id, device_label, expires_at) VALUES (?, ?, ?, ?, ?) USING TTL ${ttl}`,
        params: [
          params.userId,
          now,
          params.familyId,
          params.deviceLabel,
          expiresAt,
        ],
      },
    ],
    { prepare: true },
  );
}

export async function findSession(
  userId: string,
  familyId: string,
): Promise<RefreshSessionRow | null> {
  const result = await scylla.execute(
    "SELECT user_id, family_id, token_hash, previous_token_hash, device_label, created_at, rotated_at, expires_at FROM refresh_sessions WHERE user_id = ? AND family_id = ?",
    [userId, familyId],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row ? toSessionRow(row) : null;
}

// Conditional rotation (LWT): only one request wins concurrent refreshes.
export async function rotateSessionCas(params: {
  userId: string;
  familyId: string;
  expectedHash: string;
  expectedColumn: "token_hash" | "previous_token_hash";
  newHash: string;
  storePreviousHash: string;
  ttlSeconds?: number;
}): Promise<boolean> {
  const ttl = ttlLiteral(params.ttlSeconds ?? REFRESH_TTL_SECONDS);
  const now = new Date();
  const result = await scylla.execute(
    `UPDATE refresh_sessions USING TTL ${ttl} SET token_hash = ?, previous_token_hash = ?, rotated_at = ?, expires_at = ? WHERE user_id = ? AND family_id = ? IF ${params.expectedColumn} = ?`,
    [
      params.newHash,
      params.storePreviousHash,
      now,
      new Date(now.getTime() + ttl * 1000),
      params.userId,
      params.familyId,
      params.expectedHash,
    ],
    { prepare: true },
  );
  const applied = result.first() as unknown as { "[applied]": boolean } | null;
  return applied?.["[applied]"] ?? false;
}

export async function touchSessionIndex(params: {
  userId: string;
  familyId: string;
  createdAt: Date;
  deviceLabel: string;
  ttlSeconds?: number;
}): Promise<void> {
  const ttl = ttlLiteral(params.ttlSeconds ?? REFRESH_TTL_SECONDS);
  await scylla.execute(
    `INSERT INTO refresh_sessions_by_user (user_id, created_at, family_id, device_label, expires_at) VALUES (?, ?, ?, ?, ?) USING TTL ${ttl}`,
    [
      params.userId,
      params.createdAt,
      params.familyId,
      params.deviceLabel,
      new Date(Date.now() + ttl * 1000),
    ],
    { prepare: true },
  );
}

export async function deleteSession(
  userId: string,
  familyId: string,
  createdAt?: Date | null,
): Promise<void> {
  const queries: { query: string; params: unknown[] }[] = [
    {
      query: "DELETE FROM refresh_sessions WHERE user_id = ? AND family_id = ?",
      params: [userId, familyId],
    },
  ];
  if (createdAt) {
    queries.push({
      query:
        "DELETE FROM refresh_sessions_by_user WHERE user_id = ? AND created_at = ? AND family_id = ?",
      params: [userId, createdAt, familyId],
    });
  }
  await scylla.batch(queries, { prepare: true });
}

export async function listSessionsByUser(
  userId: string,
): Promise<UserSessionRow[]> {
  const result = await scylla.execute(
    "SELECT family_id, device_label, created_at, expires_at FROM refresh_sessions_by_user WHERE user_id = ?",
    [userId],
    { prepare: true },
  );
  return result.rows.map((r) => {
    const row = r as unknown as Record<string, unknown>;
    return {
      family_id: String(row.family_id),
      device_label: (row.device_label as string | null) ?? null,
      created_at: (row.created_at as Date | null) ?? null,
      expires_at: (row.expires_at as Date | null) ?? null,
    };
  });
}
