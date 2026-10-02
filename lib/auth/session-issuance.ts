// Session pair issuance shared by register, login and refresh: minting
// the refresh token + family row, and rebuilding the pair after a
// successful rotation. Kept out of auth.service.ts for the size budget.
import { randomUUID } from "node:crypto";
import { createSession, touchSessionIndex } from "./refresh.repository";
import { createRefreshToken, signAccessToken } from "./session";
import { findUserById } from "./user.repository";
import {
  type PublicUser,
  type SessionTokens,
  toPublicUser,
} from "./user.types";

export type RefreshOutcome =
  | { ok: true; user: PublicUser; tokens: SessionTokens }
  | { ok: false; revoked: boolean };

export async function issueSessionPair(
  user: PublicUser,
  label: string,
): Promise<SessionTokens> {
  const familyId = randomUUID();
  const refresh = createRefreshToken(user.id, familyId);
  await createSession({
    userId: user.id,
    familyId,
    tokenHash: refresh.hash,
    deviceLabel: label,
  });
  return {
    accessToken: await signAccessToken(user.id, user.tokenVersion),
    refreshToken: refresh.token,
    familyId,
  };
}

export async function buildRotatedPair(
  userId: string,
  familyId: string,
  rowCreatedAt: Date | null,
  refreshToken: string,
  label: string,
): Promise<RefreshOutcome> {
  const userRow = await findUserById(userId);
  if (!userRow || userRow.status === "locked" || userRow.status === "deleted")
    return { ok: false, revoked: false };
  if (rowCreatedAt) {
    await touchSessionIndex({
      userId,
      familyId,
      createdAt: rowCreatedAt,
      deviceLabel: label,
    }).catch(() => undefined);
  }
  const user = toPublicUser(userRow);
  return {
    ok: true,
    user,
    tokens: {
      accessToken: await signAccessToken(user.id, user.tokenVersion),
      refreshToken,
      familyId,
    },
  };
}
