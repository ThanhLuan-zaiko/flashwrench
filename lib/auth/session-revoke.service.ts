import { deleteSession, listSessionsByUser } from "./refresh.repository";

// Drop every refresh family of one account. Callers pair it with a
// token_version bump (`revokeAllSessions`, admin lock, password change):
// the bump kills live access tokens immediately and removing the families
// takes away the ability to refresh, so the account is logged out on every
// device at once. Best-effort on purpose: locking an account or logging out
// everywhere must not fail because a single family row misbehaves.
export async function revokeUserSessions(userId: string): Promise<void> {
  const sessions = await listSessionsByUser(userId).catch(() => []);
  await Promise.all(
    sessions.map((session) =>
      deleteSession(
        userId,
        session.family_id,
        session.created_at ? new Date(session.created_at) : null,
      ).catch(() => undefined),
    ),
  );
}
