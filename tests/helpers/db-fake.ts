import { mock } from "bun:test";

// Minimal in-memory stand-in for the ScyllaDB client, covering only the
// statements issued by `user.repository` claim paths and the session writes
// issued during registration. It enforces PRIMARY KEY semantics so
// regression tests can prove that concurrent duplicate registers cannot
// both succeed. Extend `execute`/`batch` branches when new tables need
// coverage; keep unknown statements as harmless no-ops.

export type FakeUserRecord = {
  userId: string;
  phone: string;
  email: string;
  passwordHash: string;
  fullName: string;
};

type FirstRow = Record<string, unknown> | null;

export const dbState = {
  phones: new Map<string, string>(),
  emails: new Map<string, string>(),
  users: new Map<string, FakeUserRecord>(),
  failBatch: false,
};

function appliedRow(applied: boolean): {
  first: () => FirstRow;
  rows: unknown[];
} {
  return { first: () => ({ "[applied]": applied }), rows: [] };
}

function singleRow(row: FirstRow): {
  first: () => FirstRow;
  rows: unknown[];
} {
  return { first: () => row, rows: [] };
}

async function fakeExecute(
  query: string,
  params: unknown[],
): Promise<{ first: () => FirstRow; rows: unknown[] }> {
  const normalized = query.replace(/\s+/g, " ");
  if (
    normalized.includes("users_by_phone") &&
    normalized.includes("IF NOT EXISTS")
  ) {
    const phone = String(params[0]);
    const userId = String(params[1]);
    if (dbState.phones.has(phone)) return appliedRow(false);
    dbState.phones.set(phone, userId);
    return appliedRow(true);
  }
  if (
    normalized.includes("users_by_email") &&
    normalized.includes("IF NOT EXISTS")
  ) {
    const email = String(params[0]);
    const userId = String(params[1]);
    if (dbState.emails.has(email)) return appliedRow(false);
    dbState.emails.set(email, userId);
    return appliedRow(true);
  }
  if (normalized.startsWith("DELETE FROM users_by_phone")) {
    dbState.phones.delete(String(params[0]));
    return singleRow(null);
  }
  if (normalized.startsWith("DELETE FROM users_by_email")) {
    dbState.emails.delete(String(params[0]));
    return singleRow(null);
  }
  if (normalized.includes("FROM users_by_phone")) {
    const owner = dbState.phones.get(String(params[0]));
    return singleRow(owner === undefined ? null : { user_id: owner });
  }
  if (normalized.includes("FROM users_by_email")) {
    const owner = dbState.emails.get(String(params[0]));
    return singleRow(owner === undefined ? null : { user_id: owner });
  }
  if (normalized.includes("FROM users_by_id")) {
    const record = dbState.users.get(String(params[0]));
    if (!record) return singleRow(null);
    return singleRow({
      user_id: record.userId,
      phone: record.phone,
      email: record.email,
      password_hash: record.passwordHash,
      full_name: record.fullName,
      role: "customer",
      avatar_url: null,
      status: "active",
      token_version: 0,
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });
  }
  return singleRow(null);
}

export const scyllaMocks = {
  execute: mock(
    async (
      query: string,
      params: unknown[],
    ): Promise<{ first: () => FirstRow; rows: unknown[] }> =>
      fakeExecute(query, params),
  ),
  batch: mock(
    async (queries: { query: string; params: unknown[] }[]): Promise<void> => {
      if (dbState.failBatch) throw new Error("fake batch failure");
      for (const item of queries) {
        if (item.query.includes("INTO users_by_id")) {
          const [userId, phone, email, passwordHash, fullName] =
            item.params as [string, string, string, string, string];
          dbState.users.set(String(userId), {
            userId: String(userId),
            phone: String(phone),
            email: String(email),
            passwordHash: String(passwordHash),
            fullName: String(fullName),
          });
        }
      }
    },
  ),
};

export const scyllaStub = {
  execute: scyllaMocks.execute,
  batch: scyllaMocks.batch,
};

export function resetDbFake(): void {
  dbState.phones.clear();
  dbState.emails.clear();
  dbState.users.clear();
  dbState.failBatch = false;
  scyllaMocks.execute.mockClear();
  scyllaMocks.batch.mockClear();
}
