import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "./password";
import { createSession } from "./refresh.repository";
import { createRefreshToken, signAccessToken } from "./session";
import { revokeUserSessions } from "./session-revoke.service";
import { clearTempPassword } from "./staff-pending.service";
import {
  bumpTokenVersion,
  findUserById,
  updatePassword,
} from "./user.repository";
import {
  type AuthResult,
  type ChangePasswordInput,
  type SessionTokens,
  toPublicUser,
} from "./user.types";
import { validateChangePasswordInput } from "./validation";

// Change password: verify the old one, store an Argon2id hash, then kick
// every other device. The current device receives a fresh token pair.
export async function changePassword(
  userId: string,
  raw: ChangePasswordInput,
  label: string,
): Promise<AuthResult> {
  const input: ChangePasswordInput = {
    currentPassword: raw.currentPassword ?? "",
    newPassword: raw.newPassword ?? "",
    confirmPassword: raw.confirmPassword ?? "",
  };

  const invalid = validateChangePasswordInput(input);
  if (invalid) return { ok: false, errors: invalid, status: 400 };

  const row = await findUserById(userId);
  if (!row || row.status === "locked" || row.status === "deleted") {
    return {
      ok: false,
      status: 401,
      errors: { form: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." },
    };
  }
  if (
    !row.password_hash ||
    !(await verifyPassword(input.currentPassword, row.password_hash))
  ) {
    return {
      ok: false,
      status: 401,
      errors: { currentPassword: "Mật khẩu hiện tại không đúng." },
    };
  }

  await updatePassword(userId, await hashPassword(input.newPassword));

  // Staff temp passwords live until the owner changes them: drop the
  // pending row so the admin list stops showing it (realtime follows).
  await clearTempPassword(userId);

  // Kick every other device: refresh families go, access tokens die on bump.
  await revokeUserSessions(userId);
  await bumpTokenVersion(userId);

  const updated = await findUserById(userId);
  if (!updated) {
    return {
      ok: false,
      status: 500,
      errors: { form: "Không đổi được mật khẩu. Vui lòng thử lại." },
    };
  }
  const user = toPublicUser(updated);

  const familyId = randomUUID();
  const refresh = createRefreshToken(user.id, familyId);
  await createSession({
    userId: user.id,
    familyId,
    tokenHash: refresh.hash,
    deviceLabel: label,
  });
  const tokens: SessionTokens = {
    accessToken: await signAccessToken(user.id, user.tokenVersion),
    refreshToken: refresh.token,
    familyId,
  };
  return { ok: true, user, tokens };
}
