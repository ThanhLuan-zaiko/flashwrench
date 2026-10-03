import { randomUUID } from "node:crypto";
import { claimGuestRecords } from "./guest-claim.service";
import { hashPassword, verifyPassword } from "./password";
import {
  deleteSession,
  findSession,
  rotateSessionCas,
} from "./refresh.repository";
import {
  createRefreshToken,
  hashToken,
  parseRefreshToken,
  REFRESH_REUSE_GRACE_SECONDS,
  REFRESH_TTL_SECONDS,
  verifyAccessToken,
} from "./session";
import {
  buildRotatedPair,
  issueSessionPair,
  type RefreshOutcome,
} from "./session-issuance";
import { revokeUserSessions } from "./session-revoke.service";
import {
  bumpTokenVersion,
  createUser,
  findUserById,
  findUserIdByEmail,
  findUserIdByPhone,
} from "./user.repository";
import {
  type AuthResult,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
  type SessionTokens,
  toPublicUser,
} from "./user.types";
import {
  isEmail,
  normalizeEmail,
  normalizePhone,
  validateLoginInput,
  validateRegisterInput,
} from "./validation";

export type { SessionListItem } from "./user-sessions";
export type { RefreshOutcome, SessionTokens };

function cleanFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function registerUser(
  raw: RegisterInput,
  label: string,
): Promise<AuthResult> {
  const input: RegisterInput = {
    fullName: raw.fullName ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    password: raw.password ?? "",
    confirmPassword: raw.confirmPassword ?? "",
  };

  const invalid = validateRegisterInput(input);
  if (invalid) return { ok: false, errors: invalid, status: 400 };

  const fullName = cleanFullName(input.fullName);
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);

  const [phoneOwner, emailOwner] = await Promise.all([
    findUserIdByPhone(phone),
    findUserIdByEmail(email),
  ]);

  if (phoneOwner || emailOwner) {
    return {
      ok: false,
      status: 409,
      errors: {
        ...(phoneOwner ? { phone: "Số điện thoại này đã được đăng ký." } : {}),
        ...(emailOwner ? { email: "Email này đã được đăng ký." } : {}),
        form: "Thông tin này đã tồn tại. Vui lòng đăng nhập.",
      },
    };
  }

  const userId = randomUUID();
  const createdOutcome = await createUser({
    userId,
    phone,
    email,
    passwordHash: await hashPassword(input.password),
    fullName,
  });

  if (!createdOutcome.ok) {
    // Race loser path: the LWT claim is authoritative. Re-read so the
    // response still tells which field is taken (phone, email, or both).
    const [phoneOwnerNow, emailOwnerNow] = await Promise.all([
      findUserIdByPhone(phone),
      findUserIdByEmail(email),
    ]);
    const phoneTaken =
      phoneOwnerNow !== null || createdOutcome.conflict === "phone";
    const emailTaken =
      emailOwnerNow !== null || createdOutcome.conflict === "email";
    return {
      ok: false,
      status: 409,
      errors: {
        ...(phoneTaken ? { phone: "Số điện thoại này đã được đăng ký." } : {}),
        ...(emailTaken ? { email: "Email này đã được đăng ký." } : {}),
        form: "Thông tin này đã tồn tại. Vui lòng đăng nhập.",
      },
    };
  }

  const created = await findUserById(userId);
  if (!created) {
    return {
      ok: false,
      status: 500,
      errors: { form: "Không tạo được tài khoản. Vui lòng thử lại." },
    };
  }
  const user = toPublicUser(created);
  // Registration proves control of the contact pair: guest bookings and
  // orders filed under the same phone+email join the fresh account so
  // the first history fetch already sees them. Best-effort — the helper
  // swallows its own errors.
  await claimGuestRecords(user);
  // Auto-grant rules (e.g. a welcome voucher) fire on account creation.
  // Best-effort: a campaign hiccup must not fail signup. The engine is
  // imported lazily — auth.service sits on the root layout's static
  // graph, and a static edge would drag the realtime protocol into the
  // first paint (see tests/unit/initial-bundle-graph.test.ts).
  if (user.role === "customer") {
    const { handleVoucherSignup } = await import(
      "@/lib/vouchers/auto-grant.service"
    );
    await handleVoucherSignup(user.id).catch(() => undefined);
  }
  // Registrations feed the member-vs-guest report as their own kind:
  // signup keeps the login counter honest and tracks the guest-to-member
  // conversion. Same lazy, best-effort treatment as the voucher hook.
  if (user.role === "customer") {
    const { recordMixEvent } = await import(
      "@/lib/customer-mix/customer-mix.service"
    );
    await recordMixEvent("signup", "member", { actor: user.id }).catch(
      () => undefined,
    );
  }
  return { ok: true, user, tokens: await issueSessionPair(user, label) };
}

export async function loginUser(
  raw: LoginInput,
  label: string,
): Promise<AuthResult> {
  const input: LoginInput = {
    identifier: (raw.identifier ?? "").trim(),
    password: raw.password ?? "",
  };

  const invalid = validateLoginInput(input);
  if (invalid) return { ok: false, errors: invalid, status: 400 };

  const identifier = input.identifier.trim();
  const userId = isEmail(identifier)
    ? await findUserIdByEmail(normalizeEmail(identifier))
    : await findUserIdByPhone(normalizePhone(identifier));

  if (!userId) {
    return {
      ok: false,
      status: 401,
      errors: { form: "Số điện thoại/email hoặc mật khẩu không đúng." },
    };
  }

  const row = await findUserById(userId);
  if (
    !row?.password_hash ||
    !(await verifyPassword(input.password, row.password_hash))
  ) {
    return {
      ok: false,
      status: 401,
      errors: { form: "Số điện thoại/email hoặc mật khẩu không đúng." },
    };
  }

  if (row.status === "locked" || row.status === "deleted") {
    const form =
      row.status === "locked"
        ? "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ."
        : "Tài khoản đã bị xóa. Vui lòng liên hệ hỗ trợ.";
    return { ok: false, status: 403, errors: { form } };
  }

  const user = toPublicUser(row);
  // Same handoff as register: a guest who booked with this account's
  // contact pair gets those records attached on sign-in.
  await claimGuestRecords(user);
  // Member sign-ins feed the member-vs-guest report. Lazy and
  // best-effort: counting must never fail authentication.
  if (user.role === "customer") {
    const { recordMixEvent } = await import(
      "@/lib/customer-mix/customer-mix.service"
    );
    await recordMixEvent("login", "member", { actor: user.id }).catch(
      () => undefined,
    );
  }
  return { ok: true, user, tokens: await issueSessionPair(user, label) };
}

// Authenticate an access token for logged-in requests (checks token_version).
export async function authenticate(
  accessToken: string,
): Promise<PublicUser | null> {
  const claims = await verifyAccessToken(accessToken);
  if (!claims) return null;
  const row = await findUserById(claims.userId);
  if (!row || row.status === "locked" || row.status === "deleted") return null;
  if ((row.token_version ?? 0) !== claims.tokenVersion) return null;
  return toPublicUser(row);
}

export async function refreshSession(
  rawToken: string,
  label: string,
): Promise<RefreshOutcome> {
  const parsed = parseRefreshToken(rawToken);
  if (!parsed) return { ok: false, revoked: false };
  const presented = hashToken(rawToken);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const row = await findSession(parsed.userId, parsed.familyId);
    if (!row) return { ok: false, revoked: false };
    if (row.expires_at && row.expires_at.getTime() < Date.now()) {
      await deleteSession(parsed.userId, parsed.familyId, row.created_at).catch(
        () => undefined,
      );
      return { ok: false, revoked: false };
    }

    if (row.token_hash === presented) {
      const next = createRefreshToken(parsed.userId, parsed.familyId);
      const applied = await rotateSessionCas({
        userId: parsed.userId,
        familyId: parsed.familyId,
        expectedHash: presented,
        expectedColumn: "token_hash",
        newHash: next.hash,
        storePreviousHash: presented,
        ttlSeconds: REFRESH_TTL_SECONDS,
      });
      if (!applied) continue;
      return buildRotatedPair(
        parsed.userId,
        parsed.familyId,
        row.created_at,
        next.token,
        label,
      );
    }

    const rotatedAt = row.rotated_at?.getTime() ?? 0;
    const withinGrace =
      Date.now() - rotatedAt <= REFRESH_REUSE_GRACE_SECONDS * 1000;
    if (row.previous_token_hash === presented && withinGrace) {
      const next = createRefreshToken(parsed.userId, parsed.familyId);
      const applied = await rotateSessionCas({
        userId: parsed.userId,
        familyId: parsed.familyId,
        expectedHash: presented,
        expectedColumn: "previous_token_hash",
        newHash: next.hash,
        storePreviousHash: row.token_hash,
        ttlSeconds: REFRESH_TTL_SECONDS,
      });
      if (!applied) continue;
      return buildRotatedPair(
        parsed.userId,
        parsed.familyId,
        row.created_at,
        next.token,
        label,
      );
    }

    // Unknown token for a known family: possible theft, revoke the family.
    await deleteSession(parsed.userId, parsed.familyId, row.created_at).catch(
      () => undefined,
    );
    return { ok: false, revoked: true };
  }
  return { ok: false, revoked: false };
}

export async function revokeSession(
  userId: string,
  familyId: string,
): Promise<void> {
  const row = await findSession(userId, familyId).catch(() => null);
  await deleteSession(userId, familyId, row?.created_at ?? null).catch(
    () => undefined,
  );
}

// Log out everywhere: drop all families and invalidate old access tokens via token_version.
export async function revokeAllSessions(userId: string): Promise<void> {
  await revokeUserSessions(userId);
  await bumpTokenVersion(userId);
}

export async function getPublicUserById(userId: string) {
  const row = await findUserById(userId);
  if (!row) return null;
  if (row.status === "locked" || row.status === "deleted") return null;
  return toPublicUser(row);
}
