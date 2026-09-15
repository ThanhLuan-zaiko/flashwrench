import type { AccountBlockReason, AccountSession } from "./account-status";
import { authenticate } from "./auth.service";
import { verifyAccessToken } from "./session";
import { findUserById } from "./user.repository";

function blockedReason(
  status: string | null | undefined,
): AccountBlockReason | null {
  return status === "locked" || status === "deleted" ? status : null;
}

// `authenticate()` answers "usable or not" and collapses a locked account,
// an expired token and a logged-out browser into `null`. That is fine for
// guards, but the browser must tell "session ended" apart from "an admin
// locked me" to force a logout with the right notice, so this reads the
// reason after a failed authentication. The happy path still costs exactly
// one user lookup; the extra reads only happen when a token stopped working.
export async function readAccountSession(
  accessToken: string,
): Promise<AccountSession> {
  const user = await authenticate(accessToken);
  if (user) return { user, status: "active" };

  const claims = await verifyAccessToken(accessToken);
  if (!claims) return { user: null, status: "active" };

  const row = await findUserById(claims.userId);
  const blocked = row ? blockedReason(row.status) : null;
  // No row, or a row that is still active: the session simply ended
  // (logged out, revoked, or token_version moved on).
  return { user: null, status: blocked ?? "active" };
}
